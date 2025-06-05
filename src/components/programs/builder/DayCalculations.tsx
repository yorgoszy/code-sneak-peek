
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, Clock, Zap } from "lucide-react";
import type { Day } from './hooks/useProgramBuilderState';

interface DayCalculationsProps {
  day: Day;
}

const parseRepsToTotal = (reps: string): number => {
  if (!reps) return 0;
  
  if (!reps.includes('.')) {
    return parseInt(reps) || 0;
  }
  
  const parts = reps.split('.');
  let totalReps = 0;
  
  parts.forEach(part => {
    totalReps += parseInt(part) || 0;
  });
  
  return totalReps;
};

const parseTempoToSeconds = (tempo: string): number => {
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

const parseRestToMinutes = (rest: string): number => {
  if (!rest) return 0;
  
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

export const DayCalculations: React.FC<DayCalculationsProps> = ({ day }) => {
  const calculateDayMetrics = () => {
    let totalVolume = 0;
    let totalTimeMinutes = 0;
    let totalWatt = 0;

    day.blocks?.forEach(block => {
      block.exercises?.forEach(exercise => {
        if (!exercise.exercise_id) return;

        const sets = exercise.sets || 1;
        const reps = parseRepsToTotal(exercise.reps || '1');
        const kg = parseFloat(exercise.kg || '0');
        const tempo = parseTempoToSeconds(exercise.tempo || '3');
        const rest = parseRestToMinutes(exercise.rest || '0');
        const velocityMs = parseFloat(exercise.velocity_ms || '0');

        // Volume: sets × reps × kg
        const volume = sets * reps * kg;
        totalVolume += volume;

        // Time: [(sets × reps) × tempo] + (sets - 1) × rest
        const workTime = (sets * reps * tempo) / 60; // Convert to minutes
        const restTime = (sets - 1) * rest;
        totalTimeMinutes += workTime + restTime;

        // Watt calculation: Power = Force × Velocity
        // Force ≈ Weight (kg) × 9.81 (gravity)
        // Velocity in m/s
        if (velocityMs > 0 && kg > 0) {
          const force = kg * 9.81; // Newtons
          const power = force * velocityMs; // Watts per rep
          const totalPowerForExercise = power * sets * reps;
          totalWatt += totalPowerForExercise;
        }
      });
    });

    return {
      volume: Math.round(totalVolume),
      timeMinutes: Math.round(totalTimeMinutes),
      watt: Math.round(totalWatt)
    };
  };

  const metrics = calculateDayMetrics();

  if (metrics.volume === 0 && metrics.timeMinutes === 0 && metrics.watt === 0) {
    return null;
  }

  return (
    <Card className="rounded-none bg-[#00ffba] text-black mb-6">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calculator className="w-4 h-4" />
              <span className="text-sm font-medium">Όγκος:</span>
              <span className="text-sm font-bold">{metrics.volume.toLocaleString()} kg</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Χρόνος:</span>
              <span className="text-sm font-bold">{metrics.timeMinutes} λεπτά</span>
            </div>
            
            {metrics.watt > 0 && (
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">Ισχύς:</span>
                <span className="text-sm font-bold">{metrics.watt.toLocaleString()} W</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
