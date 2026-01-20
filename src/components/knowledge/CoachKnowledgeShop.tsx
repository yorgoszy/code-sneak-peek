import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  // When checkout opens in a new tab, we keep the sessionId here so we can finalize the purchase
  // without relying on Stripe redirect parameters.
  const [pendingCheckout, setPendingCheckout] = useState<{ sessionId: string; courseId: string } | null>(null);
  const [processingPending, setProcessingPending] = useState(false);
  
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [courseToBuy, setCourseToBuy] = useState<Course | null>(null);

  useEffect(() => {
    fetchData();
  }, [coachId]);

  // Resume a pending checkout (if user returned without URL params)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('knowledge_pending_checkout');
      if (!raw) return;
      const parsed = JSON.parse(raw) as { sessionId: string; courseId: string };
      if (parsed?.sessionId) setPendingCheckout(parsed);
    } catch {
      // ignore
    }
  }, []);

  // Handle payment success/cancel callbacks
  useEffect(() => {
    const payment = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');
    const courseId = searchParams.get('course_id');
    
    if (payment === 'success' && sessionId) {
      console.log('🎉 Course payment successful, processing...', sessionId);
      handlePaymentSuccess(sessionId, courseId);
    } else if (payment === 'cancelled') {
      toast.error('Η πληρωμή ακυρώθηκε');
      cleanupUrlParams();
    }
  }, [searchParams]);

  // Poll for completion when checkout was opened in another tab
  useEffect(() => {
    if (!pendingCheckout?.sessionId) return;

    let cancelled = false;
    let attempts = 0;

    const tick = async () => {
      if (cancelled) return;
      attempts += 1;
      await attemptProcessCoursePayment(pendingCheckout.sessionId);
      if (attempts >= 24) {
        // ~2 minutes
        cancelled = true;
      }
    };

    // start after a short delay
    const t0 = window.setTimeout(() => {
      tick();
      const id = window.setInterval(tick, 5000);
      (tick as any).__intervalId = id;
    }, 1500);

    return () => {
      cancelled = true;
      window.clearTimeout(t0);
      const intervalId = (tick as any).__intervalId;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [pendingCheckout?.sessionId]);

  const cleanupUrlParams = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('payment');
    next.delete('session_id');
    next.delete('course_id');
    setSearchParams(next);
  };

  const PENDING_CHECKOUT_KEY = 'knowledge_pending_checkout';

  const clearPendingCheckout = () => {
    setPendingCheckout(null);
    localStorage.removeItem(PENDING_CHECKOUT_KEY);
  };

  const attemptProcessCoursePayment = async (sessionId: string) => {
    if (processingPending) return;
    setProcessingPending(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-course-payment', {
        body: { session_id: sessionId }
      });

      // When payment isn't completed yet we intentionally get a 200 with pending=true
      if (data?.pending) {
        console.log('⏳ Waiting for Stripe payment to complete...', { sessionId, status: data.payment_status });
        return;
      }

      if (error) throw error;

      console.log('✅ Course payment processed:', data);

      if (data?.alreadyOwned) {
        toast.info('Έχετε ήδη αγοράσει αυτό το μάθημα');
      } else {
        toast.success('Επιτυχής αγορά! Το μάθημα είναι πλέον διαθέσιμο.');
      }

      await fetchData();
      clearPendingCheckout();
      cleanupUrlParams();

      // Optionally open the course after unlock
      if (data?.courseId || pendingCheckout?.courseId) {
        const idToOpen = data?.courseId ?? pendingCheckout?.courseId;
        const course = courses.find(c => c.id === idToOpen);
        if (course) {
          setSelectedCourse(course);
          setViewDialogOpen(true);
        }
      }
    } catch (e) {
      console.error('Error processing course payment:', e);
      // don't clear pending - keep trying
    } finally {
      setProcessingPending(false);
    }
  };

  const handlePaymentSuccess = async (sessionId: string, _courseId: string | null) => {
    await attemptProcessCoursePayment(sessionId);
  };

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
    
    setPurchasing(true);

    try {
      // Create Stripe checkout session via edge function
      const { data, error } = await supabase.functions.invoke('create-course-payment', {
        body: {
          courseId: courseToBuy.id,
          courseTitle: courseToBuy.title,
          amount: courseToBuy.price,
          currency: "eur",
          coachId,
        }
      });

      if (error) throw error;

      console.log('✅ Stripe session created:', data);
      
      // Close dialog
      setBuyDialogOpen(false);
      setCourseToBuy(null);
      
      // Open Stripe checkout in a new tab (same as Shop)
      // and keep sessionId locally so we can finalize purchase even if redirect params don't fire.
      if (data.url && data.sessionId) {
        const pending = { sessionId: data.sessionId as string, courseId: courseToBuy.id };
        setPendingCheckout(pending);
        localStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(pending));

        toast.info('Ολοκλήρωσε την πληρωμή στο νέο tab. Θα ξεκλειδώσει αυτόματα εδώ.');
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL/session received');
      }
    } catch (error: any) {
      console.error('Error initiating payment:', error);
      toast.error('Σφάλμα δημιουργίας πληρωμής');
    } finally {
      setPurchasing(false);
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
        isPurchasing={purchasing}
      />
    </div>
  );
};
