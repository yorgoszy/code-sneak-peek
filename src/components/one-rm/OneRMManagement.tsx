import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, TrendingUp, RefreshCw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OneRMForm } from "./OneRMForm";
import { UserOneRMCard } from "./UserOneRMCard";
import { matchesSearchTerm } from "@/lib/utils";

export interface OneRMRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  weight: number;
  recorded_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  app_users?: {
    name: string;
  };
  exercises?: {
    name: string;
  };
}

export const OneRMManagement = () => {
  const [records, setRecords] = useState<OneRMRecord[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<OneRMRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("all");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [usersMap, setUsersMap] = useState<Map<string, { name: string; email: string }>>(new Map());

  useEffect(() => {
    fetchRecords();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, name, email');
      
      if (error) throw error;
      
      const map = new Map(
        (data || []).map(user => [user.id, { name: user.name, email: user.email }])
      );
      setUsersMap(map);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_exercise_1rm' as any)
        .select(`
          *,
          app_users!user_exercise_1rm_user_id_fkey(name, photo_url, avatar_url, email),
          exercises(name)
        `)
        .order('recorded_date', { ascending: false });

      if (error) throw error;
      setRecords((data as any) || []);
    } catch (error) {
      console.error('Error fetching 1RM records:', error);
      toast.error('Σφάλμα φόρτωσης καταγραφών 1RM');
    } finally {
      setIsLoading(false);
    }
  };

  // Φιλτραρισμένα records
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      // Filter by user search (name or email)
      if (userSearch.trim()) {
        const user = record.app_users as any;
        const userName = user?.name || '';
        const userEmail = user?.email || '';
        
        if (!matchesSearchTerm(userName, userSearch) && !matchesSearchTerm(userEmail, userSearch)) {
          return false;
        }
      }
      
      // Filter by exercise
      if (selectedExerciseId !== "all") {
        if (record.exercise_id !== selectedExerciseId) {
          return false;
        }
      }
      
      return true;
    });
  }, [records, userSearch, selectedExerciseId]);

  // Διαθέσιμες ασκήσεις
  const availableExercises = useMemo(() => {
    const exercisesMap = new Map<string, string>();
    records.forEach(record => {
      if (record.exercise_id && record.exercises?.name) {
        exercisesMap.set(record.exercise_id, record.exercises.name);
      }
    });
    return Array.from(exercisesMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [records]);

  // User suggestions για autocomplete
  const userSuggestions = useMemo(() => {
    if (!userSearch.trim()) return [];
    
    const uniqueUsers = new Map<string, { id: string; name: string; email: string }>();
    records.forEach(record => {
      const user = record.app_users as any;
      if (user && record.user_id) {
        uniqueUsers.set(record.user_id, {
          id: record.user_id,
          name: user.name || '',
          email: user.email || ''
        });
      }
    });
    
    return Array.from(uniqueUsers.values())
      .filter(user => 
        matchesSearchTerm(user.name, userSearch) || 
        matchesSearchTerm(user.email, userSearch)
      )
      .slice(0, 10);
  }, [userSearch, records]);

  const handleClearFilters = () => {
    setUserSearch("");
    setSelectedExerciseId("all");
  };

  // Δημιουργία flat array με όλες τις ασκήσεις (μία κάρτα ανά άσκηση)
  const getExerciseCards = (recordsToProcess: OneRMRecord[]) => {
    const exerciseCardsMap = new Map<string, {
      userId: string;
      userName: string;
      userAvatar?: string;
      exerciseId: string;
      exerciseName: string;
      weight: number;
      recordedDate: string;
      notes?: string;
    }>();

    recordsToProcess.forEach(record => {
      const userId = record.user_id;
      const userName = record.app_users?.name || 'Άγνωστος Χρήστης';
      const userAvatar = (record.app_users as any)?.photo_url || (record.app_users as any)?.avatar_url;
      const exerciseId = record.exercise_id;
      const exerciseName = record.exercises?.name || 'Άγνωστη Άσκηση';
      
      const key = `${userId}-${exerciseId}`;
      
      // Κρατάμε μόνο το πιο πρόσφατο 1RM για κάθε συνδυασμό χρήστη-άσκησης
      if (!exerciseCardsMap.has(key)) {
        exerciseCardsMap.set(key, {
          userId,
          userName,
          userAvatar,
          exerciseId,
          exerciseName,
          weight: record.weight,
          recordedDate: record.recorded_date,
          notes: record.notes
        });
      } else {
        const existing = exerciseCardsMap.get(key)!;
        if (new Date(record.recorded_date) > new Date(existing.recordedDate)) {
          exerciseCardsMap.set(key, {
            userId,
            userName,
            userAvatar,
            exerciseId,
            exerciseName,
            weight: record.weight,
            recordedDate: record.recorded_date,
            notes: record.notes
          });
        }
      }
    });

    return Array.from(exerciseCardsMap.values());
  };

  const handleAddNew = () => {
    setSelectedRecord(null);
    setIsFormOpen(true);
  };

  const handleEdit = (record: OneRMRecord) => {
    setSelectedRecord(record);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_exercise_1rm' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Η καταγραφή διαγράφηκε επιτυχώς');
      fetchRecords();
    } catch (error) {
      console.error('Error deleting 1RM record:', error);
      toast.error('Σφάλμα διαγραφής καταγραφής');
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedRecord(null);
    fetchRecords();
  };

  const handleSyncFromForceVelocity = async () => {
    setIsSyncing(true);
    try {
      // Φέρνω όλες τις καταγραφές από strength_test_attempts
      const { data: attempts, error: attemptsError } = await supabase
        .from('strength_test_attempts')
        .select(`
          id,
          weight_kg,
          test_session_id,
          exercise_id,
          strength_test_sessions!inner(
            user_id,
            test_date
          )
        `)
        .order('test_date', { ascending: false });

      if (attemptsError) throw attemptsError;

      if (!attempts || attempts.length === 0) {
        toast.info('Δεν βρέθηκαν καταγραφές Force/Velocity');
        return;
      }

      // Βρίσκω τον τρέχοντα χρήστη για το created_by
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('No user found');

      const { data: appUser } = await supabase
        .from('app_users' as any)
        .select('id')
        .eq('auth_user_id', currentUser.user.id)
        .single() as { data: { id: string } | null };

      // Οργανώνω τα δεδομένα: για κάθε user_id + exercise_id, κρατώ το μέγιστο βάρος με την πιο πρόσφατη ημερομηνία
      const userExerciseMap = new Map<string, {
        user_id: string;
        exercise_id: string;
        max_weight: number;
        recorded_date: string;
      }>();

      attempts.forEach((attempt: any) => {
        const userId = attempt.strength_test_sessions.user_id;
        const exerciseId = attempt.exercise_id;
        const weight = attempt.weight_kg;
        const date = attempt.strength_test_sessions.test_date;
        
        const key = `${userId}_${exerciseId}`;
        const existing = userExerciseMap.get(key);

        if (!existing || weight > existing.max_weight || 
           (weight === existing.max_weight && date > existing.recorded_date)) {
          userExerciseMap.set(key, {
            user_id: userId,
            exercise_id: exerciseId,
            max_weight: weight,
            recorded_date: date
          });
        }
      });

      // Για κάθε συνδυασμό, ελέγχω αν υπάρχει ήδη καταγραφή 1RM
      let created = 0;
      let updated = 0;

      for (const [key, data] of userExerciseMap.entries()) {
        // Ελέγχω αν υπάρχει ήδη καταγραφή
        const { data: existingRecords, error: checkError } = await supabase
          .from('user_exercise_1rm' as any)
          .select('*')
          .eq('user_id', data.user_id)
          .eq('exercise_id', data.exercise_id)
          .order('recorded_date', { ascending: false })
          .limit(1);

        if (checkError) {
          console.error('Error checking existing record:', checkError);
          continue;
        }

        const existingRecord = existingRecords?.[0] as any;

        // Αν δεν υπάρχει ή το νέο βάρος είναι μεγαλύτερο, ενημερώνω/δημιουργώ
        if (!existingRecord || data.max_weight > existingRecord.weight) {
          if (existingRecord) {
            // Ενημέρωση
            const { error: updateError } = await supabase
              .from('user_exercise_1rm' as any)
              .update({
                weight: data.max_weight,
                recorded_date: data.recorded_date,
                notes: 'Αυτόματη ενημέρωση από Force/Velocity tests',
                updated_at: new Date().toISOString()
              })
              .eq('id', existingRecord.id);

            if (updateError) {
              console.error('Error updating record:', updateError);
            } else {
              updated++;
            }
          } else {
            // Δημιουργία
            const { error: insertError } = await supabase
              .from('user_exercise_1rm' as any)
              .insert({
                user_id: data.user_id,
                exercise_id: data.exercise_id,
                weight: data.max_weight,
                recorded_date: data.recorded_date,
                notes: 'Αυτόματη καταγραφή από Force/Velocity tests',
                created_by: appUser?.id
              });

            if (insertError) {
              console.error('Error inserting record:', insertError);
            } else {
              created++;
            }
          }
        }
      }

      toast.success(`Συγχρονισμός ολοκληρώθηκε! ${created} νέες καταγραφές, ${updated} ενημερώσεις`);
      fetchRecords();
    } catch (error) {
      console.error('Error syncing from Force/Velocity:', error);
      toast.error('Σφάλμα συγχρονισμού δεδομένων');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">1RM - Μέγιστη Επανάληψη</h1>
          <p className="text-gray-600 mt-1">Διαχείριση 1RM ανά ασκούμενο και άσκηση</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSyncFromForceVelocity}
            disabled={isSyncing}
            variant="outline"
            className="rounded-none border-[#00ffba] text-[#00ffba] hover:bg-[#00ffba]/10"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Συγχρονισμός...' : 'Συγχρονισμός από Force/Velocity'}
          </Button>
          <Button
            onClick={handleAddNew}
            className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
          >
            <Plus className="w-4 h-4 mr-2" />
            Νέα Καταγραφή
          </Button>
        </div>
      </div>

      {/* Φίλτρα */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-stretch sm:items-start">
        {/* User Search */}
        <div className="relative w-full sm:w-[250px]">
          <Input
            type="text"
            placeholder="Αναζήτηση χρήστη (όνομα ή email)..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="rounded-none pr-8"
          />
          {userSearch && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setUserSearch("")}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          
          {showSuggestions && userSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-none shadow-lg max-h-[300px] overflow-y-auto z-50">
              {userSuggestions.map((user) => (
                <div
                  key={user.id}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setUserSearch(user.name);
                    setShowSuggestions(false);
                  }}
                >
                  <div className="font-medium text-sm">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Exercise Filter */}
        <div className="w-full sm:w-[250px]">
          <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
            <SelectTrigger className="rounded-none">
              <SelectValue placeholder="Όλες οι ασκήσεις" />
            </SelectTrigger>
            <SelectContent className="rounded-none max-h-[300px]">
              <SelectItem value="all" className="rounded-none">Όλες οι ασκήσεις</SelectItem>
              {availableExercises.map(exercise => (
                <SelectItem key={exercise.id} value={exercise.id} className="rounded-none">
                  {exercise.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters Button */}
        {(userSearch || selectedExerciseId !== "all") && (
          <Button
            variant="outline"
            onClick={handleClearFilters}
            className="rounded-none"
          >
            <X className="w-4 h-4 mr-2" />
            Καθαρισμός Φίλτρων
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">
          <TrendingUp className="h-12 w-12 mx-auto mb-3 animate-pulse text-[#00ffba]" />
          <p>Φόρτωση δεδομένων...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Δεν βρέθηκαν καταγραφές με τα επιλεγμένα φίλτρα</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {getExerciseCards(filteredRecords).map((card) => (
            <UserOneRMCard
              key={`${card.userId}-${card.exerciseId}`}
              userName={card.userName}
              userAvatar={card.userAvatar}
              exerciseName={card.exerciseName}
              weight={card.weight}
              recordedDate={card.recordedDate}
              notes={card.notes}
            />
          ))}
        </div>
      )}

      <OneRMForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedRecord(null);
        }}
        onSuccess={handleFormSuccess}
        record={selectedRecord}
      />
    </div>
  );
};
