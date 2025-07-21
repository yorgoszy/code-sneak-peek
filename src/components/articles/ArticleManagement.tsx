import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Edit, Trash2, Eye, Upload, X, CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Article {
  id: string;
  title_el: string;
  title_en?: string;
  excerpt_el: string;
  excerpt_en?: string;
  content_el: string;
  content_en?: string;
  bibliography?: string;
  image_url?: string;
  published_date: string;
  created_at: string;
  status?: string;
  scheduled_date?: string;
}

export const ArticleManagement = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [formData, setFormData] = useState({
    title_el: '',
    title_en: '',
    excerpt_el: '',
    excerpt_en: '',
    content_el: '',
    content_en: '',
    bibliography: '',
    image_url: '',
    published_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'published',
    scheduled_date: ''
  });

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('published_date', { ascending: false }); // Νεότερα πρώτα

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast({
        title: "Σφάλμα",
        description: "Αδυναμία φόρτωσης άρθρων",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('articles')
      .upload(fileName, file);

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('articles')
      .getPublicUrl(fileName);
      
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent, status: string = 'published') => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = formData.image_url;
      
      // Upload new image if selected
      if (selectedFile) {
        setUploading(true);
        imageUrl = await uploadImage(selectedFile);
      }

      const articleData = {
        ...formData,
        image_url: imageUrl,
        status: status,
        scheduled_date: status === 'scheduled' ? formData.scheduled_date : null
      };

      if (editingArticle) {
        const { error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', editingArticle.id);

        if (error) throw error;
        toast({
          title: "Επιτυχία",
          description: "Το άρθρο ενημερώθηκε επιτυχώς",
        });
      } else {
        const { error } = await supabase
          .from('articles')
          .insert([articleData]);

        if (error) throw error;
        toast({
          title: "Επιτυχία", 
          description: `Το άρθρο ${status === 'draft' ? 'αποθηκεύτηκε ως προχείρο' : status === 'scheduled' ? 'προγραμματίστηκε για δημοσίευση' : 'δημιουργήθηκε'} επιτυχώς`,
        });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchArticles();
    } catch (error) {
      console.error('Error saving article:', error);
      toast({
        title: "Σφάλμα",
        description: "Αδυναμία αποθήκευσης άρθρου",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleSaveAsDraft = (e: React.FormEvent) => {
    handleSubmit(e, 'draft');
  };

  const handleScheduledPublish = (e: React.FormEvent) => {
    if (!formData.scheduled_date) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε ημερομηνία προγραμματισμένης δημοσίευσης",
        variant: "destructive",
      });
      return;
    }
    handleSubmit(e, 'scheduled');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Σφάλμα",
          description: "Παρακαλώ επιλέξτε μια έγκυρη εικόνα",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Σφάλμα",
          description: "Το μέγεθος της εικόνας δεν πρέπει να υπερβαίνει τα 5MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setFormData({ ...formData, image_url: '' });
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setFormData({
      title_el: article.title_el,
      title_en: article.title_en || '',
      excerpt_el: article.excerpt_el,
      excerpt_en: article.excerpt_en || '',
      content_el: article.content_el,
      content_en: article.content_en || '',
      bibliography: article.bibliography || '',
      image_url: article.image_url || '',
      published_date: article.published_date,
      status: article.status || 'published',
      scheduled_date: article.scheduled_date || ''
    });
    setPreviewUrl(article.image_url || '');
    setSelectedFile(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το άρθρο;')) return;

    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Επιτυχία",
        description: "Το άρθρο διαγράφηκε επιτυχώς",
      });
      
      fetchArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      toast({
        title: "Σφάλμα",
        description: "Αδυναμία διαγραφής άρθρου",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title_el: '',
      title_en: '',
      excerpt_el: '',
      excerpt_en: '',
      content_el: '',
      content_en: '',
      bibliography: '',
      image_url: '',
      published_date: format(new Date(), 'yyyy-MM-dd'),
      status: 'published',
      scheduled_date: ''
    });
    setEditingArticle(null);
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Διαχείριση Άρθρων</h1>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
        >
          <Plus className="w-4 h-4 mr-2" />
          Νέο Άρθρο
        </Button>
      </div>

      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Λίστα Άρθρων</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Φόρτωση...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Τίτλος</TableHead>
                  <TableHead>Ημερομηνία</TableHead>
                  <TableHead>Γλώσσα</TableHead>
                  <TableHead>Κατάσταση</TableHead>
                  <TableHead className="text-right">Ενέργειες</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((article, index) => (
                  <TableRow key={article.id}>
                    <TableCell className="font-mono text-sm text-gray-500">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{article.title_el}</TableCell>
                    <TableCell>{format(new Date(article.published_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>Δίγλωσσο</TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        article.status === 'published' && "bg-green-100 text-green-800",
                        article.status === 'draft' && "bg-gray-100 text-gray-800",
                        article.status === 'scheduled' && "bg-blue-100 text-blue-800"
                      )}>
                        {article.status === 'published' && 'Δημοσιευμένο'}
                        {article.status === 'draft' && 'Προχείρο'}
                        {article.status === 'scheduled' && 'Προγραμματισμένο'}
                        {!article.status && 'Δημοσιευμένο'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(article)}
                          className="rounded-none"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(article.id)}
                          className="rounded-none text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-none">
          <DialogHeader>
            <DialogTitle>
              {editingArticle ? 'Επεξεργασία Άρθρου' : 'Νέο Άρθρο'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title_el">Τίτλος (Ελληνικά) *</Label>
                <Input
                  id="title_el"
                  value={formData.title_el}
                  onChange={(e) => setFormData({ ...formData, title_el: e.target.value })}
                  required
                  className="rounded-none"
                />
              </div>
              <div>
                <Label htmlFor="title_en">Τίτλος (English)</Label>
                <Input
                  id="title_en"
                  value={formData.title_en}
                  onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                  className="rounded-none"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="published_date">Ημερομηνία Δημοσίευσης *</Label>
              <Input
                id="published_date"
                type="date"
                value={formData.published_date}
                onChange={(e) => setFormData({ ...formData, published_date: e.target.value })}
                required
                className="rounded-none"
              />
            </div>

            <div>
              <Label htmlFor="image">Φωτογραφία Άρθρου</Label>
              <div className="space-y-4">
                {/* Image Preview */}
                {previewUrl && (
                  <div className="relative w-full h-48 border rounded-none overflow-hidden">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 rounded-none"
                      onClick={handleRemoveImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                
                {/* File Upload */}
                <div className="flex items-center space-x-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="rounded-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image')?.click()}
                    className="rounded-none"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Επιλογή
                  </Button>
                </div>
                
                {/* Alternative URL Input */}
                <div>
                  <Label htmlFor="image_url" className="text-sm text-gray-600">
                    Ή εισάγετε URL εικόνας
                  </Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => {
                      setFormData({ ...formData, image_url: e.target.value });
                      if (e.target.value && !selectedFile) {
                        setPreviewUrl(e.target.value);
                      }
                    }}
                    placeholder="https://example.com/image.jpg"
                    className="rounded-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="excerpt_el">Περίληψη (Ελληνικά) *</Label>
                <Textarea
                  id="excerpt_el"
                  value={formData.excerpt_el}
                  onChange={(e) => setFormData({ ...formData, excerpt_el: e.target.value })}
                  required
                  rows={3}
                  className="rounded-none"
                />
              </div>
              <div>
                <Label htmlFor="excerpt_en">Περίληψη (English)</Label>
                <Textarea
                  id="excerpt_en"
                  value={formData.excerpt_en}
                  onChange={(e) => setFormData({ ...formData, excerpt_en: e.target.value })}
                  rows={3}
                  className="rounded-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="content_el">Περιεχόμενο Άρθρου (Ελληνικά) *</Label>
                <Textarea
                  id="content_el"
                  value={formData.content_el}
                  onChange={(e) => setFormData({ ...formData, content_el: e.target.value })}
                  required
                  rows={10}
                  className="rounded-none"
                />
              </div>
              <div>
                <Label htmlFor="content_en">Περιεχόμενο Άρθρου (English)</Label>
                <Textarea
                  id="content_en"
                  value={formData.content_en}
                  onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
                  rows={10}
                  className="rounded-none"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bibliography">Βιβλιογραφία</Label>
              <Textarea
                id="bibliography"
                value={formData.bibliography}
                onChange={(e) => setFormData({ ...formData, bibliography: e.target.value })}
                rows={4}
                placeholder="Αναφέρετε τις πηγές και τη βιβλιογραφία..."
                className="rounded-none"
              />
            </div>

            <div>
              <Label htmlFor="scheduled_date">Ημερομηνία Προγραμματισμένης Δημοσίευσης</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-none",
                      !formData.scheduled_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.scheduled_date ? format(new Date(formData.scheduled_date), "dd/MM/yyyy") : "Επιλέξτε ημερομηνία"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.scheduled_date ? new Date(formData.scheduled_date) : undefined}
                    onSelect={(date) => setFormData({ ...formData, scheduled_date: date ? format(date, 'yyyy-MM-dd') : '' })}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-gray-500 mt-1">
                Για προγραμματισμένη δημοσίευση, επιλέξτε μελλοντική ημερομηνία
              </p>
            </div>

            <div className="flex justify-between">
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveAsDraft}
                  disabled={loading || uploading}
                  className="rounded-none"
                >
                  Αποθήκευση ως Προχείρο
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleScheduledPublish}
                  disabled={loading || uploading}
                  className="rounded-none"
                >
                  Προγραμματισμένη Δημοσίευση
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDialogClose}
                  className="rounded-none"
                >
                  Ακύρωση
                </Button>
                <Button
                  type="submit"
                  disabled={loading || uploading}
                  className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                >
                  {uploading ? 'Μεταφόρτωση...' : loading ? 'Αποθήκευση...' : editingArticle ? 'Ενημέρωση' : 'Δημοσίευση'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};