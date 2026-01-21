import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileDown, Send, MessageCircle, Clock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';

interface Course {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  thumbnail_url: string | null;
  price: number;
  duration_minutes: number | null;
  category: string | null;
  pdf_url?: string | null;
  video_file_path?: string | null;
}

interface Question {
  id: string;
  question: string;
  answer: string | null;
  created_at: string;
  answered_at: string | null;
}

interface CourseViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  coachId: string;
}

const extractYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const getVideoUrl = async (videoFilePath: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from('course-videos')
      .createSignedUrl(videoFilePath, 3600); // 1 hour expiry
    
    if (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
    return data.signedUrl;
  } catch (e) {
    console.error('Error getting video URL:', e);
    return null;
  }
};

export const CourseViewDialog: React.FC<CourseViewDialogProps> = ({
  isOpen,
  onClose,
  course,
  coachId
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);

  useEffect(() => {
    if (isOpen && course) {
      fetchQuestions();
      // Load video URL if video_file_path exists
      if (course.video_file_path) {
        setVideoLoading(true);
        getVideoUrl(course.video_file_path).then((url) => {
          setVideoUrl(url);
          setVideoLoading(false);
        });
      } else {
        setVideoUrl(null);
      }
    }
  }, [isOpen, course?.id, course?.video_file_path]);

  const fetchQuestions = async () => {
    if (!course) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('course_questions')
        .select('*')
        .eq('course_id', course.id)
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuestion = async () => {
    if (!course || !newQuestion.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('course_questions')
        .insert({
          course_id: course.id,
          coach_id: coachId,
          question: newQuestion.trim()
        });

      if (error) throw error;

      // Send email notification to admin
      try {
        await supabase.functions.invoke('send-course-question-email', {
          body: {
            courseId: course.id,
            courseTitle: course.title,
            coachId: coachId,
            question: newQuestion.trim()
          }
        });
      } catch (emailError) {
        console.error('Email notification error:', emailError);
        // Don't fail the whole operation if email fails
      }

      toast.success('Η ερώτηση στάλθηκε επιτυχώς');
      setNewQuestion('');
      fetchQuestions();
    } catch (error) {
      console.error('Error submitting question:', error);
      toast.error('Σφάλμα αποστολής ερώτησης');
    } finally {
      setSubmitting(false);
    }
  };

  if (!course) return null;

  const videoId = extractYouTubeId(course.youtube_url);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-none max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {course.title}
            {course.category && (
              <Badge variant="outline" className="rounded-none">
                {course.category}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {/* Video Player - prioritize storage video over YouTube */}
            {videoLoading ? (
              <div className="aspect-video bg-black rounded-none overflow-hidden flex items-center justify-center">
                <p className="text-white">Φόρτωση βίντεο...</p>
              </div>
            ) : videoUrl ? (
              <div className="aspect-video bg-black rounded-none overflow-hidden">
                <video
                  src={videoUrl}
                  controls
                  controlsList="nodownload"
                  onContextMenu={(e) => e.preventDefault()}
                  className="w-full h-full"
                  title={course.title}
                >
                  Ο browser σας δεν υποστηρίζει video.
                </video>
              </div>
            ) : videoId ? (
              <div className="aspect-video bg-black rounded-none overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={course.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="aspect-video bg-muted rounded-none flex items-center justify-center">
                <p className="text-muted-foreground">Δεν υπάρχει διαθέσιμο βίντεο</p>
              </div>
            )}

            {/* Description */}
            {course.description && (
              <div className="bg-muted/50 p-3 rounded-none">
                <p className="text-sm text-muted-foreground">{course.description}</p>
              </div>
            )}

            {/* PDF Download */}
            {course.pdf_url && (
              <div className="flex items-center justify-between bg-muted/50 p-3 rounded-none">
                <div className="flex items-center gap-2 text-sm truncate">
                  <FileDown className="w-4 h-4 text-[#cb8954] flex-shrink-0" />
                  <span className="truncate">{course.pdf_url.split('/').pop()}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-none flex-shrink-0 ml-2"
                  onClick={async () => {
                    try {
                      const response = await fetch(course.pdf_url!);
                      if (!response.ok) throw new Error('Download failed');
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = course.pdf_url!.split('/').pop() || 'document.pdf';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                    } catch (error) {
                      console.error('Download error:', error);
                      toast.error('Σφάλμα λήψης PDF');
                    }
                  }}
                >
                  <FileDown className="w-4 h-4 mr-1" />
                  Λήψη
                </Button>
              </div>
            )}

            <Separator />

            {/* Q&A Section */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Ερωτήσεις & Απαντήσεις
              </h3>

              {/* Ask Question */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Γράψτε την ερώτησή σας..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="rounded-none resize-none"
                  rows={3}
                />
                <Button
                  onClick={handleSubmitQuestion}
                  disabled={!newQuestion.trim() || submitting}
                  className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitting ? 'Αποστολή...' : 'Αποστολή Ερώτησης'}
                </Button>
              </div>

              {/* Questions List */}
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Φόρτωση...</p>
              ) : questions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Δεν υπάρχουν ερωτήσεις ακόμα
                </p>
              ) : (
                <div className="space-y-3">
                  {questions.map((q) => (
                    <div key={q.id} className="border rounded-none p-3 space-y-2">
                      {/* Question */}
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 mt-0.5 text-[#cb8954]" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{q.question}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(q.created_at), 'd MMM yyyy, HH:mm', { locale: el })}
                          </p>
                        </div>
                      </div>

                      {/* Answer */}
                      {q.answer ? (
                        <div className="ml-6 bg-[#00ffba]/10 p-2 rounded-none border-l-2 border-[#00ffba]">
                          <p className="text-sm">{q.answer}</p>
                          {q.answered_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Απάντηση: {format(new Date(q.answered_at), 'd MMM yyyy, HH:mm', { locale: el })}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="ml-6 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          Αναμονή απάντησης...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
