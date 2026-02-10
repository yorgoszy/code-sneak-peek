 import { useState, useEffect } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 
 export const useUserSubscriptionStatus = (userId: string | undefined) => {
   const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     const checkSubscription = async () => {
       if (!userId) {
         setHasActiveSubscription(false);
         setLoading(false);
         return;
       }
 
       try {
         // Πρώτα ελέγχουμε αν ο χρήστης ανήκει σε coach
         const { data: userData, error: userError } = await supabase
           .from('app_users')
           .select('coach_id')
           .eq('id', userId)
           .single();
 
         if (userError) throw userError;
 
         let isCoachManaged = false;
         if (userData?.coach_id) {
           const { data: coachData } = await supabase
             .from('app_users')
             .select('role')
             .eq('id', userData.coach_id)
             .single();
 
           isCoachManaged = coachData?.role === 'coach';
         }
 
         const today = new Date().toISOString().split('T')[0];
 
         if (isCoachManaged) {
           // Έλεγχος στο coach_subscriptions
           const { data: coachSub, error: coachSubError } = await supabase
             .from('coach_subscriptions')
             .select('id')
             .eq('user_id', userId)
             .eq('status', 'active')
             .gte('end_date', today)
             .limit(1);
 
            if (coachSubError) throw coachSubError;
            if ((coachSub?.length || 0) > 0) {
              setHasActiveSubscription(true);
              return;
            }
          } else {
            // Έλεγχος στο user_subscriptions
            const { data: userSub, error: userSubError } = await supabase
              .from('user_subscriptions')
              .select('id')
              .eq('user_id', userId)
              .eq('status', 'active')
              .gte('end_date', today)
              .limit(1);

            if (userSubError) throw userSubError;
            if ((userSub?.length || 0) > 0) {
              setHasActiveSubscription(true);
              return;
            }
          }

          // Έλεγχος για ενεργό program assignment
          const { data: activeAssignment, error: assignmentError } = await supabase
            .from('program_assignments')
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'active')
            .gte('end_date', today)
            .limit(1);

          if (assignmentError) throw assignmentError;
          setHasActiveSubscription((activeAssignment?.length || 0) > 0);
       } catch (error) {
         console.error('Error checking subscription status:', error);
         setHasActiveSubscription(false);
       } finally {
         setLoading(false);
       }
     };
 
     checkSubscription();
   }, [userId]);
 
   return { hasActiveSubscription, loading };
 };