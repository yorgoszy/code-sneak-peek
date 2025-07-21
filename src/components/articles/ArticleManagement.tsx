import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Eye, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  bibliography?: string;
  image_url?: string;
  published_date: string;
  language: string;
  created_at: string;
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
    title: '',
    excerpt: '',
    content: '',
    bibliography: '',
    image_url: '',
    published_date: format(new Date(), 'yyyy-MM-dd'),
    language: 'el'
  });

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

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

  const handleSubmit = async (e: React.FormEvent) => {
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
        image_url: imageUrl
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
          description: "Το άρθρο δημιουργήθηκε επιτυχώς",
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
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      bibliography: article.bibliography || '',
      image_url: article.image_url || '',
      published_date: article.published_date,
      language: article.language
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
      title: '',
      excerpt: '',
      content: '',
      bibliography: '',
      image_url: '',
      published_date: format(new Date(), 'yyyy-MM-dd'),
      language: 'el'
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
                  <TableHead>Τίτλος</TableHead>
                  <TableHead>Ημερομηνία</TableHead>
                  <TableHead>Γλώσσα</TableHead>
                  <TableHead className="text-right">Ενέργειες</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell className="font-medium">{article.title}</TableCell>
                    <TableCell>{format(new Date(article.published_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{article.language === 'el' ? 'Ελληνικά' : 'English'}</TableCell>
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
                <Label htmlFor="title">Τίτλος *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="rounded-none"
                />
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

            <div>
              <Label htmlFor="excerpt">Περίληψη *</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                required
                rows={3}
                className="rounded-none"
              />
            </div>

            <div>
              <Label htmlFor="content">Περιεχόμενο Άρθρου *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                rows={10}
                className="rounded-none"
              />
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

            <div className="flex justify-end space-x-2">
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
                {uploading ? 'Μεταφόρτωση...' : loading ? 'Αποθήκευση...' : editingArticle ? 'Ενημέρωση' : 'Δημιουργία'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};