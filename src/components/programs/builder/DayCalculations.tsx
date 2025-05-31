import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Exercise } from '../types';

interface ProgramExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps: string;
  percentage_1rm: number;
  kg: string;
  velocity_ms: string;
  tempo: string;
  rest: string;
  exercise_order: number;
}

interface Block {
  id: string;
  name: string;
  block_order: number;
  exercises: ProgramExercise[];
}

interface DayCalculationsProps {
  blocks: Block[];
  exercises: Exercise[];
}

export const DayCalculations: React.FC<DayCalculationsProps> = ({ blocks, exercises }) => {
  // Helper function to parse tempo string to seconds
  const parseTempoToSeconds = (tempo: string): number => {
    // If tempo is empty, treat as "1.1.1" (3 seconds)
    if (!tempo || tempo.trim() === '') {
      return 3;
    }
    
    const parts = tempo.split('.');
    let totalSeconds = 0;
    
    parts.forEach(part => {
      if (part === 'x' || part === 'X') {
        totalSeconds += 0.5;
      } else {
        totalSeconds += parseFloat(part) || 0;
      }
    });
    
    return totalSeconds;
  };

  // Helper function to parse reps string to total reps
  const parseRepsToTotal = (reps: string): number => {
    if (!reps) return 0;
    
    // If it's a simple number, return it
    if (!reps.includes('.')) {
      return parseInt(reps) || 0;
    }
    
    // If it's in format like "1.2.1.3", sum all parts
    const parts = reps.split('.');
    let totalReps = 0;
    
    parts.forEach(part => {
      totalReps += parseInt(part) || 0;
    });
    
    return totalReps;
  };

  // Helper function to parse rest time to minutes
  const parseRestToMinutes = (rest: string): number => {
    if (!rest) return 0;
    
    // Handle formats like "2'", "1:30", "90s", "2"
    if (rest.includes(':')) {
      const [minutes, seconds] = rest.split(':');
      return (parseInt(minutes) || 0) + (parseInt(seconds) || 0) / 60;
    } else if (rest.includes("'")) {
      return parseFloat(rest.replace("'", "")) || 0;
    } else if (rest.includes('s')) {
      return (parseFloat(rest.replace('s', '')) || 0) / 60;
    } else {
      return parseFloat(rest) || 0;
    }
  };

  // Calculate all metrics
  const calculateMetrics = () => {
    let totalVolume = 0;
    let totalWatts = 0;
    let totalTimeMinutes = 0;
    let totalIntensityPoints = 0;
    let exerciseCount = 0;

    blocks.forEach(block => {
      block.exercises.forEach(exercise => {
        if (!exercise.exercise_id) return;

        const sets = exercise.sets || 1;
        const reps = parseRepsToTotal(exercise.reps);
        const kg = parseFloat(exercise.kg) || 0;
        const velocity = parseFloat(exercise.velocity_ms) || 0;
        const tempo = parseTempoToSeconds(exercise.tempo);
        const rest = parseRestToMinutes(exercise.rest);

        // Volume: sets × reps × kg
        const volume = sets * reps * kg;
        totalVolume += volume;

        // Watts: Force × Velocity = (kg × 9.81) × m/s
        if (kg > 0 && velocity > 0) {
          const force = kg * 9.81; // Convert to Newtons
          const watts = force * velocity;
          totalWatts += watts * sets * reps; // Total watts for all reps
        }

        // Time: [(sets × reps) × tempo] + (sets - 1) × rest
        const workTime = (sets * reps * tempo) / 60; // Convert to minutes
        const restTime = (sets - 1) * rest;
        totalTimeMinutes += workTime + restTime;

        // Average Intensity (using percentage 1RM)
        if (exercise.percentage_1rm > 0) {
          totalIntensityPoints += exercise.percentage_1rm;
          exerciseCount++;
        }
      });
    });

    const averageIntensity = exerciseCount > 0 ? totalIntensityPoints / exerciseCount : 0;

    return {
      volume: Math.round(totalVolume),
      averageIntensity: Math.round(averageIntensity * 10) / 10,
      totalWatts: Math.round(totalWatts),
      totalTime: Math.round(totalTimeMinutes * 10) / 10
    };
  };

  const metrics = calculateMetrics();

  return (
    <Card className="mt-2" style={{ borderRadius: '0px' }}>
      <CardHeader className="py-2">
        <CardTitle className="text-xs text-gray-600">Υπολογισμοί Ημέρας</CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="text-center">
            <div className="font-medium text-blue-600">{metrics.volume} kg</div>
            <div className="text-gray-500">Όγκος</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-green-600">{metrics.averageIntensity}%</div>
            <div className="text-gray-500">Μ.Ο. Ένταση</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-purple-600">{metrics.totalWatts} W</div>
            <div className="text-gray-500">Συνολικά Watts</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-orange-600">{metrics.totalTime} λεπτά</div>
            <div className="text-gray-500">Χρόνος</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
