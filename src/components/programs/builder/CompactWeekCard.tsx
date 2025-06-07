
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Exercise, Week } from '../types';

interface CompactWeekCardProps {
  week: Week;
  exercises: Exercise[];
}

export const CompactWeekCard: React.FC<CompactWeekCardProps> = ({
  week,
  exercises
}) => {
  return (
    <Card className="rounded-none border border-gray-300 w-48 h-32 overflow-hidden">
      <CardContent className="p-1 h-full">
        <div className="space-y-1 h-full overflow-hidden">
          {week.program_days.map((day) => (
            <div key={day.id} className="space-y-0.5">
              <div className="text-xs font-semibold text-gray-900 truncate">
                {day.name}
              </div>
              
              {day.program_blocks?.map((block, blockIndex) => (
                <div key={block.id} className="space-y-0.5">
                  <div className="text-xs font-medium text-gray-700 truncate">
                    Block {blockIndex + 1}
                  </div>
                  
                  <div className="space-y-0.5">
                    {block.program_exercises?.map((exercise) => {
                      const exerciseData = exercises.find(e => e.id === exercise.exercise_id);
                      
                      return (
                        <div key={exercise.id} className="bg-gray-50 p-0.5 rounded text-xs">
                          <div className="truncate font-medium text-gray-800 mb-0.5">
                            {exerciseData?.name || 'Άγνωστη άσκηση'}
                          </div>
                          <div className="text-xs text-gray-600 space-y-0.5">
                            <div>SET: {exercise.sets}</div>
                            <div>REPS: {exercise.reps}</div>
                            {exercise.percentage_1rm && <div>%1RM: {exercise.percentage_1rm}%</div>}
                            {exercise.kg && <div>KG: {exercise.kg}</div>}
                            {exercise.velocity_ms && <div>M/S: {exercise.velocity_ms}</div>}
                            {exercise.tempo && <div>TEMPO: {exercise.tempo}</div>}
                            {exercise.rest && <div>REST: {exercise.rest}</div>}
                            {exercise.notes && <div>NOTES: {exercise.notes}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
