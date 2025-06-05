
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, Clock, Zap, TrendingUp } from "lucide-react";
import type { Week } from './hooks/useProgramBuilderState';

interface WeekCalculationsProps {
  week: Week;
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

export const WeekCalculations: React.FC<WeekCalculationsProps> = ({ week }) => {
  const calculateWeekMetrics = () => {
    let totalVolume = 0;
    let totalTimeMinutes = 0;
    let totalWatt = 0;
    let trainingDays = 0;

    week.days?.forEach(day => {
      let dayHasExercises = false;
      
      day.blocks?.forEach(block => {
        block.exercises?.forEach(exercise => {
          if (!exercise.exercise_id) return;

          dayHasExercises = true;
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
          if (velocityMs > 0 && kg > 0) {
            const force = kg * 9.81; // Newtons
            const power = force * velocityMs; // Watts per rep
            const totalPowerForExercise = power * sets * reps;
            totalWatt += totalPowerForExercise;
          }
        });
      });

      if (dayHasExercises) {
        trainingDays++;
      }
    });

    return {
      volume: Math.round(totalVolume),
      timeMinutes: Math.round(totalTimeMinutes),
      watt: Math.round(totalWatt),
      trainingDays
    };
  };

  const metrics = calculateWeekMetrics();

  if (metrics.volume === 0 && metrics.timeMinutes === 0 && metrics.watt === 0) {
    return null;
  }

  return (
    <Card className="rounded-none bg-[#00ffba] text-black mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Μέρες:</span>
              <span className="text-sm font-bold">{metrics.trainingDays}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              <span className="text-sm font-medium">Συνολικός Όγκος:</span>
              <span className="text-sm font-bold">{metrics.volume.toLocaleString()} kg</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Συνολικός Χρόνος:</span>
              <span className="text-sm font-bold">{Math.floor(metrics.timeMinutes / 60)}ώ {metrics.timeMinutes % 60}λ</span>
            </div>
            
            {metrics.watt > 0 && (
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">Συνολική Ισχύς:</span>
                <span className="text-sm font-bold">{metrics.watt.toLocaleString()} W</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
