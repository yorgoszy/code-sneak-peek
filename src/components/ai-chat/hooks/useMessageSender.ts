
import { useState } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Message } from './types';

interface UseMessageSenderProps {
  userId?: string;
  hasActiveSubscription: boolean;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  checkSubscriptionStatus: () => Promise<void>;
}

export const useMessageSender = ({
  userId,
  hasActiveSubscription,
  setMessages,
  checkSubscriptionStatus
}: UseMessageSenderProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading || !userId) return;

    // Αυστηρός έλεγχος συνδρομής πριν από κάθε μήνυμα
    if (!hasActiveSubscription) {
      console.log('❌ useMessageSender: No active subscription - blocking message');
      toast.error('Απαιτείται ενεργή συνδρομή για να χρησιμοποιήσεις το RID AI');
      
      // Επανέλεγχος συνδρομής
      await checkSubscriptionStatus();
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      content: userMessage,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      console.log('🤖 useMessageSender: Calling RID AI for user:', userId, 'Message:', userMessage);
      
      // Fetch user's programs with full details including user info
      const { data: programs } = await supabase
        .from('program_assignments')
        .select(`
          id,
          training_dates,
          status,
          start_date,
          end_date,
          notes,
          created_at,
          programs:program_id (
            id,
            name,
            description,
            program_weeks (
              id,
              name,
              week_number,
              program_days (
                id,
                name,
                day_number,
                estimated_duration_minutes,
                program_blocks (
                  id,
                  name,
                  block_order,
                  program_exercises (
                    id,
                    sets,
                    reps,
                    kg,
                    tempo,
                    rest,
                    notes,
                    percentage_1rm,
                    velocity_ms,
                    exercise_order,
                    exercises:exercise_id (
                      id,
                      name,
                      description
                    )
                  )
                )
              )
            )
          ),
          app_users:user_id (
            id,
            name,
            email,
            photo_url
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      // Fetch workout completions for each program to calculate stats
      let programsWithStats = programs || [];
      if (programs && programs.length > 0) {
        const assignmentIds = programs.map(p => p.id);
        const { data: completions } = await supabase
          .from('workout_completions')
          .select('*')
          .in('assignment_id', assignmentIds)
          .order('scheduled_date', { ascending: false });

        // Calculate stats for each program
        programsWithStats = programs.map(program => {
          const programCompletions = (completions || []).filter(c => c.assignment_id === program.id);
          const trainingDates = program.training_dates || [];
          
          // Calculate unique completed dates
          const uniqueCompletedDates = new Set();
          programCompletions.forEach(c => {
            if (c.status === 'completed' && trainingDates.includes(c.scheduled_date)) {
              uniqueCompletedDates.add(c.scheduled_date);
            }
          });
          
          const completedWorkouts = uniqueCompletedDates.size;
          const missedWorkouts = programCompletions.filter(c => c.status === 'missed').length;
          const totalWorkouts = trainingDates.length;
          const progress = totalWorkouts > 0 
            ? Math.min(100, Math.round((completedWorkouts / totalWorkouts) * 100))
            : 0;

          return {
            ...program,
            workoutStats: {
              completed: completedWorkouts,
              total: totalWorkouts,
              missed: missedWorkouts,
              progress
            }
          };
        });
      }

      // Fetch strength test history (Force-Velocity data)
      const { data: strengthHistory } = await supabase
        .from('strength_test_attempts')
        .select(`
          weight_kg,
          velocity_ms,
          exercise_id,
          exercises:exercise_id (name),
          strength_test_sessions!inner (
            user_id,
            test_date
          )
        `)
        .eq('strength_test_sessions.user_id', userId)
        .not('velocity_ms', 'is', null)
        .order('strength_test_sessions.test_date', { ascending: false })
        .limit(50);

      // Fetch endurance test history
      const { data: enduranceHistory } = await supabase
        .from('endurance_test_data')
        .select(`
          mas_kmh,
          mas_meters,
          mas_minutes,
          vo2_max,
          max_hr,
          resting_hr_1min,
          push_ups,
          pull_ups,
          crunches,
          t2b,
          sprint_meters,
          sprint_seconds,
          sprint_watt,
          farmer_kg,
          farmer_meters,
          farmer_seconds,
          endurance_test_sessions!inner (
            user_id,
            test_date
          )
        `)
        .eq('endurance_test_sessions.user_id', userId)
        .order('endurance_test_sessions.test_date', { ascending: false })
        .limit(20);

      // Fetch jump test history
      const { data: jumpHistory } = await supabase
        .from('jump_test_data')
        .select(`
          non_counter_movement_jump,
          counter_movement_jump,
          depth_jump,
          broad_jump,
          triple_jump_left,
          triple_jump_right,
          jump_test_sessions!inner (
            user_id,
            test_date
          )
        `)
        .eq('jump_test_sessions.user_id', userId)
        .order('jump_test_sessions.test_date', { ascending: false })
        .limit(20);

      // Fetch anthropometric test history
      const { data: anthropometricHistory } = await supabase
        .from('anthropometric_test_data')
        .select(`
          weight,
          height,
          body_fat_percentage,
          muscle_mass_percentage,
          visceral_fat_percentage,
          bone_density,
          waist_circumference,
          hip_circumference,
          chest_circumference,
          arm_circumference,
          thigh_circumference,
          anthropometric_test_sessions!inner (
            user_id,
            test_date
          )
        `)
        .eq('anthropometric_test_sessions.user_id', userId)
        .order('anthropometric_test_sessions.test_date', { ascending: false })
        .limit(20);

      // Fetch all workout completions για calendar_data
      const { data: allCompletions } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_date', { ascending: true });

      // Δημιουργία calendar_data από τα programs
      const calendar_data: any[] = [];
      if (programsWithStats && programsWithStats.length > 0) {
        for (const program of programsWithStats) {
          const trainingDates = program.training_dates || [];
          const programData = program.programs as any;
          const programWeeks = programData?.program_weeks || [];
          
          if (programWeeks.length === 0) continue;
          
          const programDays = programWeeks[0]?.program_days || [];
          if (programDays.length === 0) continue;
          
          trainingDates.forEach((dateStr: string, index: number) => {
            const dayIndex = index % programDays.length;
            const dayProgram = programDays[dayIndex];
            
            // Βρες το status από workout_completions
            const completion = (allCompletions || []).find(
              (c: any) => c.assignment_id === program.id && c.scheduled_date === dateStr
            );
            const status = completion?.status || 'scheduled';
            
            // Συλλογή ασκήσεων με λεπτομέρειες
            const exercises: string[] = [];
            if (dayProgram.program_blocks && Array.isArray(dayProgram.program_blocks)) {
              for (const block of dayProgram.program_blocks) {
                if (block.program_exercises && Array.isArray(block.program_exercises)) {
                  for (const ex of block.program_exercises) {
                    const exName = ex.exercises?.name || 'Άσκηση';
                    const sets = ex.sets || '-';
                    const reps = ex.reps || '-';
                    const kg = ex.kg || '-';
                    const rest = ex.rest || '-';
                    const tempo = ex.tempo || '-';
                    exercises.push(`${exName}: ${sets}x${reps} @ ${kg}kg, tempo: ${tempo}, rest: ${rest}`);
                  }
                }
              }
            }
            
            calendar_data.push({
              date: dateStr,
              program: programData?.name || 'Πρόγραμμα',
              day: dayProgram.name || `Ημέρα ${dayProgram.day_number}`,
              status: status,
              exercises: exercises
            });
          });
        }
      }
      
      const { data, error } = await supabase.functions.invoke('smart-ai-chat', {
        body: {
          message: userMessage,
          userId: userId,
          platformData: {
            programs: programsWithStats || [],
            strengthHistory: strengthHistory || [],
            enduranceHistory: enduranceHistory || [],
            jumpHistory: jumpHistory || [],
            anthropometricHistory: anthropometricHistory || [],
            calendar_data: calendar_data
          }
        }
      });

      if (error) {
        console.error('❌ useMessageSender: RID AI Error:', error);
        
        // Αν το error είναι για συνδρομή, ενημερώνουμε την κατάσταση
        if (error.message?.includes('No active subscription') || error.message?.includes('subscription')) {
          toast.error('Η συνδρομή σου έχει λήξει. Επικοινώνησε με τον διαχειριστή.');
          return;
        }
        
        throw error;
      }

      console.log('✅ useMessageSender: RID AI Response received:', data);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Αποθήκευση στη βάση δεδομένων
      try {
        console.log('💾 Saving conversation to database...');
        
        await supabase.from('ai_conversations').insert([
          {
            user_id: userId,
            content: userMessage,
            message_type: 'user',
            metadata: {}
          },
          {
            user_id: userId,
            content: data.response,
            message_type: 'assistant',
            metadata: { aiType: 'rid-smart' }
          }
        ]);

        console.log('✅ Conversation saved successfully');
      } catch (saveError) {
        console.error('❌ Error saving conversation:', saveError);
        // Δεν διακόπτουμε τη λειτουργία αν αποτύχει η αποθήκευση
      }

    } catch (error) {
      console.error('💥 useMessageSender: RID AI Error:', error);
      toast.error('Σφάλμα στον RID AI βοηθό');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Λυπάμαι, αντιμετωπίζω τεχνικά προβλήματα. Παρακαλώ δοκιμάστε ξανά σε λίγο.',
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return { sendMessage, isLoading };
};
