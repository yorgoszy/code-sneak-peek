 import { useState, useEffect } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { resolveUserSubscriptionScope } from './userSubscriptionScope';
 
 export const useUserSubscriptionStatus = (userId: string | undefined) => {
   const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     const checkSubscription = async () => {
       setLoading(true);
       if (!userId) {
         setHasActiveSubscription(false);
         setLoading(false);
         return;
       }
 
       try {
         const scope = await resolveUserSubscriptionScope(userId);
         const isCoachManaged = scope.is_coach_managed;
 
         const today = new Date().toISOString().split('T')[0];
 
         if (isCoachManaged) {
           // Έλεγχος στο coach_subscriptions
           const { data: coachSub, error: coachSubError } = await supabase
             .from('coach_subscriptions')
             .select('id')
             .eq('user_id', userId)
             .eq('coach_id', scope.coach_id ?? '')
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