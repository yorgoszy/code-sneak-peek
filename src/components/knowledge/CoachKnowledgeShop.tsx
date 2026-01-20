import React, { useState, useEffect } from 'react';
import { BookOpen, ShoppingBag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CourseShopCard } from './CourseShopCard';
import { CourseViewDialog } from './CourseViewDialog';
import { BuyConfirmDialog } from './BuyConfirmDialog';
import { Card, CardContent } from '@/components/ui/card';

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
}

interface CoachKnowledgeShopProps {
  coachId: string;
}

export const CoachKnowledgeShop: React.FC<CoachKnowledgeShopProps> = ({ coachId }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [courseToBuy, setCourseToBuy] = useState<Course | null>(null);

  useEffect(() => {
    fetchData();
  }, [coachId]);

  const fetchData = async () => {
    try {
      // Fetch active courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('knowledge_courses')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;

      // Fetch coach purchases
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('coach_course_purchases')
        .select('course_id')
        .eq('coach_id', coachId)
        .eq('status', 'completed');

      if (purchasesError) throw purchasesError;

      setCourses(coursesData || []);
      setPurchasedIds(new Set(purchasesData?.map(p => p.course_id) || []));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Σφάλμα φόρτωσης μαθημάτων');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = (course: Course) => {
    setCourseToBuy(course);
    setBuyDialogOpen(true);
  };

  const handleConfirmBuy = async () => {
    if (!courseToBuy) return;

    try {
      const { error } = await supabase
        .from('coach_course_purchases')
        .insert({
          coach_id: coachId,
          course_id: courseToBuy.id,
          amount_paid: courseToBuy.price,
          status: 'completed'
        });

      if (error) throw error;

      toast.success('Επιτυχής αγορά! Το μάθημα είναι πλέον διαθέσιμο.');
      setBuyDialogOpen(false);
      setCourseToBuy(null);
      fetchData();
    } catch (error: any) {
      console.error('Error purchasing course:', error);
      if (error.code === '23505') {
        toast.error('Έχετε ήδη αγοράσει αυτό το μάθημα');
      } else {
        toast.error('Σφάλμα αγοράς');
      }
    }
  };

  const handleOpen = (course: Course) => {
    setSelectedCourse(course);
    setViewDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Φόρτωση...
      </div>
    );
  }

  const purchasedCourses = courses.filter(c => purchasedIds.has(c.id));
  const availableCourses = courses.filter(c => !purchasedIds.has(c.id));

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ShoppingBag className="w-6 h-6 text-[#cb8954]" />
        <h1 className="text-xl font-bold">Knowledge Shop</h1>
      </div>

      {/* Purchased Courses */}
      {purchasedCourses.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Τα Μαθήματά μου ({purchasedCourses.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchasedCourses.map((course) => (
              <CourseShopCard
                key={course.id}
                course={course}
                isPurchased={true}
                onBuy={handleBuy}
                onOpen={handleOpen}
              />
            ))}
          </div>
        </div>
      )}

      {/* Available Courses */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" />
          Διαθέσιμα Μαθήματα ({availableCourses.length})
        </h2>
        {availableCourses.length === 0 ? (
          <Card className="rounded-none">
            <CardContent className="p-8 text-center text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Δεν υπάρχουν διαθέσιμα μαθήματα προς αγορά</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableCourses.map((course) => (
              <CourseShopCard
                key={course.id}
                course={course}
                isPurchased={false}
                onBuy={handleBuy}
                onOpen={handleOpen}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CourseViewDialog
        isOpen={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        course={selectedCourse}
        coachId={coachId}
      />

      <BuyConfirmDialog
        isOpen={buyDialogOpen}
        onClose={() => {
          setBuyDialogOpen(false);
          setCourseToBuy(null);
        }}
        course={courseToBuy}
        onConfirm={handleConfirmBuy}
      />
    </div>
  );
};
