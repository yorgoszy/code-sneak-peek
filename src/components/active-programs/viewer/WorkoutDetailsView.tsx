
import React from 'react';
import { Clock, Dumbbell } from "lucide-react";

interface WorkoutDetailsViewProps {
  currentDay: any;
}

export const WorkoutDetailsView: React.FC<WorkoutDetailsViewProps> = ({ currentDay }) => {
  if (!currentDay) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-none p-3">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
            <Dumbbell className="h-4 w-4" />
            <span>{currentDay.name || `Ημέρα ${currentDay.day_number}`}</span>
          </h4>
        </div>
        {currentDay.estimated_duration_minutes && (
          <div className="flex items-center space-x-1 text-xs text-gray-600">
            <Clock className="h-3 w-3" />
            <span>{currentDay.estimated_duration_minutes} λεπτά</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {currentDay.program_blocks?.map((block: any) => (
          <div key={block.id} className="bg-gray-50 p-2 rounded-none border border-gray-200">
            <h5 className="font-medium text-sm mb-2">
              Block {block.block_order}: {block.name}
            </h5>
            {block.program_exercises && block.program_exercises.length > 0 ? (
              <div className="space-y-2">
                {block.program_exercises.map((exercise: any) => (
                  <div key={exercise.id} className="bg-white rounded-none border border-gray-200 p-2">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h6 className="text-sm font-medium text-gray-900">
                          {exercise.exercises?.name || 'Άγνωστη άσκηση'}
                        </h6>
                      </div>
                    </div>
                    
                    {/* Exercise Details Grid */}
                    <div className="grid grid-cols-6 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-medium text-gray-600 mb-1">Sets</div>
                        <div className="text-gray-900">{exercise.sets || '-'}</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="font-medium text-gray-600 mb-1">Reps</div>
                        <div className="text-gray-900">{exercise.reps || '-'}</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="font-medium text-gray-600 mb-1">%1RM</div>
                        <div className="text-gray-900">{exercise.percentage_1rm ? `${exercise.percentage_1rm}%` : '-'}</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="font-medium text-gray-600 mb-1">Kg</div>
                        <div className="text-gray-900">{exercise.kg || '-'}</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="font-medium text-gray-600 mb-1">m/s</div>
                        <div className="text-gray-900">{exercise.velocity_ms || '-'}</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="font-medium text-gray-600 mb-1">Rest</div>
                        <div className="text-gray-900">{exercise.rest || '-'}</div>
                      </div>
                    </div>
                    
                    {exercise.tempo && (
                      <div className="mt-2 text-xs text-gray-600">
                        <span className="font-medium">Tempo:</span> {exercise.tempo}
                      </div>
                    )}
                    
                    {exercise.notes && (
                      <div className="mt-1 text-xs text-gray-600 italic">
                        {exercise.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Δεν υπάρχουν ασκήσεις</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
