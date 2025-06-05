
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const DatabaseDebugger: React.FC = () => {
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, video_url')
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

  useEffect(() => {
    fetchExercises();
  }, []);

  return (
    <Card className="rounded-none max-w-4xl mx-auto mt-4">
      <CardHeader>
        <CardTitle>Database Debug - Exercises Video URLs</CardTitle>
        <Button onClick={fetchExercises} disabled={loading} className="w-fit">
          {loading ? 'Φόρτωση...' : 'Ανανέωση'}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {exercises.map((exercise) => (
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
          ))}
          
          {exercises.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              Δεν βρέθηκαν ασκήσεις στη βάση δεδομένων
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
