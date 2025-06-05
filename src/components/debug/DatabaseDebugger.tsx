
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const DatabaseDebugger: React.FC = () => {
  const [exercises, setExercises] = useState<any[]>([]);
  const [programExercises, setProgramExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'exercises' | 'programs'>('exercises');

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, video_url')
        .ilike('name', '%squat%')
        .limit(10);
      
      if (error) {
        console.error('❌ Error fetching exercises:', error);
      } else {
        console.log('✅ Fetched exercises:', data);
        setExercises(data || []);
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
    }
    setLoading(false);
  };

  const fetchProgramExercises = async () => {
    setLoading(true);
    try {
      // Φέρνω program exercises με τις ασκήσεις τους όπως ακριβώς γίνεται στην εφαρμογή
      const { data, error } = await supabase
        .from('program_exercises')
        .select(`
          id,
          sets,
          reps,
          exercises (
            id,
            name,
            video_url
          )
        `)
        .limit(10);
      
      if (error) {
        console.error('❌ Error fetching program exercises:', error);
      } else {
        console.log('✅ Fetched program exercises:', data);
        setProgramExercises(data || []);
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'exercises') {
      fetchExercises();
    } else {
      fetchProgramExercises();
    }
  }, [activeTab]);

  const renderExerciseData = (exercise: any) => (
    <div key={exercise.id} className="p-3 border border-gray-200 rounded-none">
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <strong>Όνομα:</strong> {exercise.name}
        </div>
        <div>
          <strong>Video URL Type:</strong> {typeof exercise.video_url}
        </div>
        <div>
          <strong>Video URL Value:</strong> 
          <pre className="text-xs bg-gray-100 p-1 mt-1 rounded">
            {JSON.stringify(exercise.video_url, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );

  const renderProgramExerciseData = (programExercise: any) => (
    <div key={programExercise.id} className="p-3 border border-gray-200 rounded-none">
      <div className="grid grid-cols-4 gap-4 text-sm">
        <div>
          <strong>Program Exercise ID:</strong> {programExercise.id}
        </div>
        <div>
          <strong>Exercise Name:</strong> {programExercise.exercises?.name || 'N/A'}
        </div>
        <div>
          <strong>Video URL Type:</strong> {typeof programExercise.exercises?.video_url}
        </div>
        <div>
          <strong>Video URL Value:</strong> 
          <pre className="text-xs bg-gray-100 p-1 mt-1 rounded">
            {JSON.stringify(programExercise.exercises?.video_url, null, 2)}
          </pre>
        </div>
      </div>
      <div className="text-xs text-gray-600 mt-2">
        Sets: {programExercise.sets}, Reps: {programExercise.reps}
      </div>
    </div>
  );

  return (
    <Card className="rounded-none max-w-6xl mx-auto mt-4">
      <CardHeader>
        <CardTitle>Database Debug - Video URLs</CardTitle>
        <div className="flex gap-2">
          <Button 
            onClick={() => setActiveTab('exercises')}
            variant={activeTab === 'exercises' ? 'default' : 'outline'}
            className="text-xs"
            disabled={loading}
          >
            Direct Exercises
          </Button>
          <Button 
            onClick={() => setActiveTab('programs')}
            variant={activeTab === 'programs' ? 'default' : 'outline'}
            className="text-xs"
            disabled={loading}
          >
            Program Exercises
          </Button>
          <Button 
            onClick={activeTab === 'exercises' ? fetchExercises : fetchProgramExercises} 
            disabled={loading} 
            className="text-xs"
          >
            {loading ? 'Φόρτωση...' : 'Ανανέωση'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {activeTab === 'exercises' && (
            <>
              <h3 className="font-medium text-sm">Ασκήσεις που περιέχουν "squat" στο όνομα:</h3>
              {exercises.map(renderExerciseData)}
              {exercises.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  Δεν βρέθηκαν ασκήσεις squat στη βάση δεδομένων
                </div>
              )}
            </>
          )}
          
          {activeTab === 'programs' && (
            <>
              <h3 className="font-medium text-sm">Program Exercises όπως φέρνονται στην εφαρμογή:</h3>
              {programExercises.map(renderProgramExerciseData)}
              {programExercises.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  Δεν βρέθηκαν program exercises στη βάση δεδομένων
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
