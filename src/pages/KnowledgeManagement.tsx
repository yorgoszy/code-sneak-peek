import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Play, Euro, Clock, BookOpen, Youtube, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { useEffectiveCoachId } from '@/hooks/useEffectiveCoachId';
import { CoachKnowledgeShop } from '@/components/knowledge/CoachKnowledgeShop';

interface Course {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  thumbnail_url: string | null;
  price: number;
  duration_minutes: number | null;
  category: string | null;
  is_active: boolean;
  pdf_url: string | null;
  created_at: string;
}

const KnowledgeManagement: React.FC = () => {
  const { isAdmin } = useRoleCheck();
  const { effectiveCoachId } = useEffectiveCoachId();
  const isCoach = !isAdmin() && !!effectiveCoachId;
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtube_url: '',
    pdf_url: '',
    pdf_file: null as File | null,
    price: '' as string | number,
    duration_minutes: '' as string | number,
    category: '',
  });
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [fetchingDuration, setFetchingDuration] = useState(false);

  useEffect(() => {
    if (!isCoach) {
      fetchCourses();
    } else {
      setLoading(false);
    }
  }, [isCoach]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Σφάλμα φόρτωσης μαθημάτων');
    } finally {
      setLoading(false);
    }
  };

  // If coach, render shop view
  if (isCoach && effectiveCoachId) {
    return <CoachKnowledgeShop coachId={effectiveCoachId} />;
  }

  const extractYouTubeThumbnail = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    if (match && match[1]) {
      return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
    }
    return null;
  };

  const handleOpenDialog = (course?: Course) => {
    if (course) {
      setSelectedCourse(course);
      setFormData({
        title: course.title,
        description: course.description || '',
        youtube_url: course.youtube_url,
        pdf_url: course.pdf_url || '',
        pdf_file: null,
        price: course.price,
        duration_minutes: course.duration_minutes || '',
        category: course.category || '',
      });
    } else {
      setSelectedCourse(null);
      setFormData({
        title: '',
        description: '',
        youtube_url: '',
        pdf_url: '',
        pdf_file: null,
        price: '',
        duration_minutes: '',
        category: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.youtube_url) {
      toast.error('Συμπληρώστε τίτλο και YouTube URL');
      return;
    }

    const priceValue = typeof formData.price === 'string'
      ? parseFloat(formData.price) || 0
      : formData.price;

    if (priceValue <= 0) {
      toast.error('Η τιμή πρέπει να είναι μεγαλύτερη από 0');
      return;
    }

    const durationValue = typeof formData.duration_minutes === 'string'
      ? (formData.duration_minutes.trim() ? parseInt(formData.duration_minutes, 10) : null)
      : (formData.duration_minutes || null);

    const thumbnail = extractYouTubeThumbnail(formData.youtube_url);

    try {
      // 1) Upload PDF (if selected)
      let pdfUrl = formData.pdf_url;
      if (formData.pdf_file) {
        setUploadingPdf(true);
        try {
          const fileExt = (formData.pdf_file.name.split('.').pop() || 'pdf').toLowerCase();
          const uid = (globalThis.crypto && 'randomUUID' in globalThis.crypto)
            ? (globalThis.crypto as Crypto).randomUUID()
            : Math.random().toString(36).slice(2);
          const fileName = `${Date.now()}-${uid}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('course-pdfs')
            .upload(fileName, formData.pdf_file, {
              cacheControl: '3600',
              upsert: false,
              contentType: 'application/pdf',
            });

          if (uploadError) {
            console.error('PDF upload error:', uploadError);
            toast.error(`Σφάλμα μεταφόρτωσης PDF: ${uploadError.message}`);
            return;
          }

          const { data: urlData } = supabase.storage
            .from('course-pdfs')
            .getPublicUrl(fileName);

          pdfUrl = urlData.publicUrl;
        } finally {
          setUploadingPdf(false);
        }
      }

      // 2) Insert/Update course
      if (selectedCourse) {
        const { error } = await supabase
          .from('knowledge_courses')
          .update({
            title: formData.title,
            description: formData.description || null,
            youtube_url: formData.youtube_url,
            thumbnail_url: thumbnail,
            pdf_url: pdfUrl || null,
            price: priceValue,
            duration_minutes: durationValue,
            category: formData.category || null,
          })
          .eq('id', selectedCourse.id);

        if (error) {
          console.error('Course update error:', error);
          toast.error(`Σφάλμα ενημέρωσης: ${error.message}`);
          return;
        }

        toast.success('Το μάθημα ενημερώθηκε');
      } else {
        const { error } = await supabase
          .from('knowledge_courses')
          .insert([
            {
              title: formData.title,
              description: formData.description || null,
              youtube_url: formData.youtube_url,
              thumbnail_url: thumbnail,
              pdf_url: pdfUrl || null,
              price: priceValue,
              duration_minutes: durationValue,
              category: formData.category || null,
            },
          ]);

        if (error) {
          console.error('Course insert error:', error);
          toast.error(`Σφάλμα δημιουργίας: ${error.message}`);
          return;
        }

        toast.success('Το μάθημα δημιουργήθηκε');
      }

      setDialogOpen(false);
      fetchCourses();
    } catch (error) {
      // This is usually a network / CORS / blocked-request case
      console.error('Error saving course (unexpected):', error);
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(`Σφάλμα αποθήκευσης: ${msg}`);
      setUploadingPdf(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCourse) return;

    try {
      const { error } = await supabase
        .from('knowledge_courses')
        .delete()
        .eq('id', selectedCourse.id);

      if (error) throw error;
      toast.success('Το μάθημα διαγράφηκε');
      setDeleteDialogOpen(false);
      setSelectedCourse(null);
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Σφάλμα διαγραφής');
    }
  };

  const toggleActive = async (course: Course) => {
    try {
      const { error } = await supabase
        .from('knowledge_courses')
        .update({ is_active: !course.is_active })
        .eq('id', course.id);

      if (error) throw error;
      toast.success(course.is_active ? 'Απενεργοποιήθηκε' : 'Ενεργοποιήθηκε');
      fetchCourses();
    } catch (error) {
      console.error('Error toggling course:', error);
      toast.error('Σφάλμα ενημέρωσης');
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Φόρτωση...
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">Knowledge Base</h1>
        </div>
        <Button onClick={() => handleOpenDialog()} className="rounded-none">
          <Plus className="w-4 h-4 mr-2" />
          Νέο Μάθημα
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card className="rounded-none">
          <CardContent className="p-8 text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Δεν υπάρχουν μαθήματα</p>
            <p className="text-sm">Δημιουργήστε το πρώτο σας μάθημα</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Card key={course.id} className={`rounded-none overflow-hidden ${!course.is_active ? 'opacity-50' : ''}`}>
              {/* Thumbnail */}
              <div className="relative aspect-video bg-muted">
                {course.thumbnail_url ? (
                  <img 
                    src={course.thumbnail_url} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '';
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Youtube className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge className={`rounded-none ${course.is_active ? 'bg-green-500' : 'bg-muted-foreground'}`}>
                    {course.is_active ? 'Ενεργό' : 'Ανενεργό'}
                  </Badge>
                </div>
                <div className="absolute bottom-2 left-2">
                  <Badge variant="secondary" className="rounded-none bg-black/70 text-white">
                    <Euro className="w-3 h-3 mr-1" />
                    {course.price}€
                  </Badge>
                </div>
                {course.duration_minutes && (
                  <div className="absolute bottom-2 right-2">
                    <Badge variant="secondary" className="rounded-none bg-black/70 text-white">
                      <Clock className="w-3 h-3 mr-1" />
                      {course.duration_minutes} λεπτά
                    </Badge>
                  </div>
                )}
              </div>

              <CardContent className="p-3 space-y-2">
                <h3 className="font-semibold text-sm truncate">{course.title}</h3>
                {course.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>
                )}
                {course.category && (
                  <Badge variant="outline" className="rounded-none text-xs">
                    {course.category}
                  </Badge>
                )}

                <div className="flex items-center gap-1 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 rounded-none text-xs"
                    onClick={() => window.open(course.youtube_url, '_blank')}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Προβολή
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-none"
                    onClick={() => handleOpenDialog(course)}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-none"
                    onClick={() => toggleActive(course)}
                  >
                    {course.is_active ? '🔴' : '🟢'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-none text-destructive"
                    onClick={() => {
                      setSelectedCourse(course);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-none max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedCourse ? 'Επεξεργασία Μαθήματος' : 'Νέο Μάθημα'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Τίτλος *</Label>
              <Input
                className="rounded-none"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="π.χ. Τεχνική Straight Punch"
              />
            </div>

            <div>
              <Label>YouTube URL *</Label>
              <Input
                className="rounded-none"
                value={formData.youtube_url}
                onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>

            <div>
              <Label>Περιγραφή</Label>
              <Textarea
                className="rounded-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Περιγραφή μαθήματος..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Τιμή (€) *</Label>
                <Input
                  type="number"
                  className="rounded-none"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  min={0.01}
                  step={0.01}
                  placeholder="π.χ. 45"
                />
              </div>
              <div>
                <Label>Διάρκεια (λεπτά)</Label>
                <Input
                  type="number"
                  className="rounded-none"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  min={1}
                  placeholder="π.χ. 30"
                />
              </div>
            </div>

            <div>
              <Label>Κατηγορία</Label>
              <Input
                className="rounded-none"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="π.χ. Τεχνική, Τακτική, Φυσική Κατάσταση"
              />
            </div>

            <div>
              <Label className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                PDF Αρχείο (προαιρετικό)
              </Label>
              <div className="space-y-2">
                <Input
                  type="file"
                  accept=".pdf"
                  className="rounded-none"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setFormData({ ...formData, pdf_file: file });
                  }}
                />
                {formData.pdf_url && !formData.pdf_file && (
                  <p className="text-xs text-muted-foreground">
                    Υπάρχον PDF: {formData.pdf_url.split('/').pop()}
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-none" onClick={() => setDialogOpen(false)} disabled={uploadingPdf}>
              Ακύρωση
            </Button>
            <Button className="rounded-none" onClick={handleSave} disabled={uploadingPdf}>
              {uploadingPdf ? 'Μεταφόρτωση...' : selectedCourse ? 'Ενημέρωση' : 'Δημιουργία'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Είστε σίγουροι;</AlertDialogTitle>
            <AlertDialogDescription>
              Αυτή η ενέργεια δεν μπορεί να αναιρεθεί. Το μάθημα θα διαγραφεί οριστικά.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 rounded-none">
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default KnowledgeManagement;
