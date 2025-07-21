import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface Result {
  id: string;
  result_date: string;
  title_el: string;
  title_en: string | null;
  content_el: string;
  content_en: string | null;
  image_url: string | null;
  hashtags: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ResultFormData {
  result_date: Date;
  title_el: string;
  title_en: string;
  content_el: string;
  content_en: string;
  image_url: string;
  hashtags: string;
  status: string;
}

export const ResultsManagement: React.FC = () => {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<Result | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resultToDelete, setResultToDelete] = useState<Result | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<ResultFormData>({
    result_date: new Date(),
    title_el: '',
    title_en: '',
    content_el: '',
    content_en: '',
    image_url: '',
    hashtags: '',
    status: 'published'
  });

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('results')
        .select('*')
        .order('result_date', { ascending: false });

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία φόρτωσης αποτελεσμάτων",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const resultData = {
        result_date: format(formData.result_date, 'yyyy-MM-dd'),
        title_el: formData.title_el,
        title_en: formData.title_en || null,
        content_el: formData.content_el,
        content_en: formData.content_en || null,
        image_url: formData.image_url || null,
        hashtags: formData.hashtags || null,
        status: formData.status
      };

      if (editingResult) {
        const { error } = await supabase
          .from('results')
          .update(resultData)
          .eq('id', editingResult.id);

        if (error) throw error;

        toast({
          title: "Επιτυχία",
          description: "Το αποτέλεσμα ενημερώθηκε επιτυχώς",
        });
      } else {
        const { error } = await supabase
          .from('results')
          .insert([resultData]);

        if (error) throw error;

        toast({
          title: "Επιτυχία",
          description: "Το αποτέλεσμα δημιουργήθηκε επιτυχώς",
        });
      }

      fetchResults();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving result:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία αποθήκευσης αποτελέσματος",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (result: Result) => {
    setEditingResult(result);
    setFormData({
      result_date: new Date(result.result_date),
      title_el: result.title_el,
      title_en: result.title_en || '',
      content_el: result.content_el,
      content_en: result.content_en || '',
      image_url: result.image_url || '',
      hashtags: result.hashtags || '',
      status: result.status
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!resultToDelete) return;

    try {
      const { error } = await supabase
        .from('results')
        .delete()
        .eq('id', resultToDelete.id);

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: "Το αποτέλεσμα διαγράφηκε επιτυχώς",
      });

      fetchResults();
    } catch (error) {
      console.error('Error deleting result:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία διαγραφής αποτελέσματος",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setResultToDelete(null);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingResult(null);
    setFormData({
      result_date: new Date(),
      title_el: '',
      title_en: '',
      content_el: '',
      content_en: '',
      image_url: '',
      hashtags: '',
      status: 'published'
    });
  };

  if (loading) {
    return <div className="flex justify-center p-8">Φόρτωση...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Διαχείριση Αποτελεσμάτων</h1>
        <Button 
          onClick={() => setIsDialogOpen(true)}
          className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
        >
          <Plus className="w-4 h-4 mr-2" />
          Νέο Αποτέλεσμα
        </Button>
      </div>

      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Λίστα Αποτελεσμάτων</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Τίτλος</TableHead>
                <TableHead>Ημερομηνία</TableHead>
                <TableHead>Γλώσσα</TableHead>
                <TableHead>Κατάσταση</TableHead>
                <TableHead>Ενέργειες</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    Δεν υπάρχουν αποτελέσματα
                  </TableCell>
                </TableRow>
              ) : (
                results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">
                      {result.title_el}
                    </TableCell>
                    <TableCell>
                      {format(new Date(result.result_date), 'dd/MM/yyyy', { locale: el })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="rounded-none">ΕΛ</Badge>
                        {result.title_en && (
                          <Badge variant="outline" className="rounded-none">EN</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={result.status === 'published' ? 'default' : 'secondary'}
                        className="rounded-none"
                      >
                        {result.status === 'published' ? 'Δημοσιευμένο' : 'Πρόχειρο'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(result)}
                          className="rounded-none"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setResultToDelete(result);
                            setDeleteDialogOpen(true);
                          }}
                          className="rounded-none text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto rounded-none">
          <DialogHeader>
            <DialogTitle>
              {editingResult ? 'Επεξεργασία Αποτελέσματος' : 'Νέο Αποτέλεσμα'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="result_date">Ημερομηνία</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal rounded-none",
                        !formData.result_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.result_date ? (
                        format(formData.result_date, "dd/MM/yyyy", { locale: el })
                      ) : (
                        <span>Επιλέξτε ημερομηνία</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-none" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.result_date}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, result_date: date }))}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Image URL */}
              <div className="space-y-2">
                <Label htmlFor="image_url">URL Εικόνας</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="rounded-none"
                />
              </div>
            </div>

            {/* Hashtags */}
            <div className="space-y-2">
              <Label htmlFor="hashtags">Hashtags</Label>
              <Input
                id="hashtags"
                value={formData.hashtags}
                onChange={(e) => setFormData(prev => ({ ...prev, hashtags: e.target.value }))}
                placeholder="#hashtag1 #hashtag2 #hashtag3"
                className="rounded-none"
              />
            </div>

            {/* Bilingual Content Tabs */}
            <Tabs defaultValue="el" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-none">
                <TabsTrigger value="el" className="rounded-none">Ελληνικά</TabsTrigger>
                <TabsTrigger value="en" className="rounded-none">English</TabsTrigger>
              </TabsList>

              <TabsContent value="el" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title_el">Τίτλος (Ελληνικά) *</Label>
                  <Input
                    id="title_el"
                    value={formData.title_el}
                    onChange={(e) => setFormData(prev => ({ ...prev, title_el: e.target.value }))}
                    required
                    className="rounded-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content_el">Κείμενο (Ελληνικά) *</Label>
                  <Textarea
                    id="content_el"
                    value={formData.content_el}
                    onChange={(e) => setFormData(prev => ({ ...prev, content_el: e.target.value }))}
                    rows={6}
                    required
                    className="rounded-none"
                  />
                </div>
              </TabsContent>

              <TabsContent value="en" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title_en">Title (English)</Label>
                  <Input
                    id="title_en"
                    value={formData.title_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, title_en: e.target.value }))}
                    className="rounded-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content_en">Content (English)</Label>
                  <Textarea
                    id="content_en"
                    value={formData.content_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, content_en: e.target.value }))}
                    rows={6}
                    className="rounded-none"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                className="rounded-none"
              >
                Ακύρωση
              </Button>
              <Button
                type="submit"
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
              >
                {editingResult ? 'Ενημέρωση' : 'Δημιουργία'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Επιβεβαίωση διαγραφής"
        description="Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το αποτέλεσμα;"
        confirmText="Διαγραφή"
        cancelText="Ακύρωση"
      />
    </div>
  );
};