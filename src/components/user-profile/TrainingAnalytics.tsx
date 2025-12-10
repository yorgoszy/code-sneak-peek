import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dumbbell, Zap, Clock, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TrainingAnalyticsProps {
  userId: string;
}

interface WorkoutAnalysis {
  strength_hours: number;
  endurance_hours: number;
  power_hours: number;
  speed_hours: number;
  total_hours: number;
}

export const TrainingAnalytics: React.FC<TrainingAnalyticsProps> = ({ userId }) => {
  const [analysis, setAnalysis] = useState<WorkoutAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrainingAnalysis();
  }, [userId]);

  const fetchTrainingAnalysis = async () => {
    try {
      setLoading(true);
      
      // Φέρνουμε τα workout stats από τον νέο πίνακα
      const { data: stats, error } = await supabase
        .from('workout_stats')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Σφάλμα φόρτωσης workout stats:', error);
        setAnalysis({
          strength_hours: 0,
          endurance_hours: 0,
          power_hours: 0,
          speed_hours: 0,
          total_hours: 0
        });
        return;
      }

      if (!stats || stats.length === 0) {
        setAnalysis({
          strength_hours: 0,
          endurance_hours: 0,
          power_hours: 0,
          speed_hours: 0,
          total_hours: 0
        });
        return;
      }

      // Αθροίζουμε τα λεπτά ανά τύπο από όλες τις ολοκληρωμένες προπονήσεις
      const totals = stats.reduce((acc, stat) => ({
        strength_minutes: acc.strength_minutes + (stat.strength_minutes || 0),
        endurance_minutes: acc.endurance_minutes + (stat.endurance_minutes || 0),
        power_minutes: acc.power_minutes + (stat.power_minutes || 0),
        speed_minutes: acc.speed_minutes + (stat.speed_minutes || 0),
        total_minutes: acc.total_minutes + (stat.total_duration_minutes || 0)
      }), {
        strength_minutes: 0,
        endurance_minutes: 0,
        power_minutes: 0,
        speed_minutes: 0,
        total_minutes: 0
      });

      // Μετατροπή λεπτών σε ώρες
      setAnalysis({
        strength_hours: totals.strength_minutes / 60,
        endurance_hours: totals.endurance_minutes / 60,
        power_hours: totals.power_minutes / 60,
        speed_hours: totals.speed_minutes / 60,
        total_hours: totals.total_minutes / 60
      });

    } catch (error) {
      console.error('Σφάλμα ανάλυσης προπονήσεων:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatHours = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} λεπτά`;
    }
    return `${hours.toFixed(1)} ώρες`;
  };

  const getPercentage = (hours: number, total: number): number => {
    return total > 0 ? (hours / total) * 100 : 0;
  };

  if (loading) {
    return (
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm md:text-base">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
            Ανάλυση Προπονήσεων
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-gray-500">Φόρτωση ανάλυσης...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis || analysis.total_hours === 0) {
    return (
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm md:text-base">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
            Ανάλυση Προπονήσεων
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-gray-500">Δεν υπάρχουν δεδομένα προπονήσεων</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm md:text-base">
          <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
          Ανάλυση Προπονήσεων
          <span className="text-xs md:text-sm font-normal text-gray-600 ml-auto">
            Σύνολο: {formatHours(analysis.total_hours)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Προπόνηση Δύναμης */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Δύναμη</span>
            </div>
            <span className="text-sm text-gray-600">
              {formatHours(analysis.strength_hours)}
            </span>
          </div>
          <Progress 
            value={getPercentage(analysis.strength_hours, analysis.total_hours)} 
            className="h-2"
          />
        </div>

        {/* Προπόνηση Αντοχής */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Αντοχή</span>
            </div>
            <span className="text-sm text-gray-600">
              {formatHours(analysis.endurance_hours)}
            </span>
          </div>
          <Progress 
            value={getPercentage(analysis.endurance_hours, analysis.total_hours)} 
            className="h-2"
          />
        </div>

        {/* Προπόνηση Ισχύος */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium">Ισχύς</span>
            </div>
            <span className="text-sm text-gray-600">
              {formatHours(analysis.power_hours)}
            </span>
          </div>
          <Progress 
            value={getPercentage(analysis.power_hours, analysis.total_hours)} 
            className="h-2"
          />
        </div>

        {/* Προπόνηση Ταχύτητας */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium">Ταχύτητα</span>
            </div>
            <span className="text-sm text-gray-600">
              {formatHours(analysis.speed_hours)}
            </span>
          </div>
          <Progress 
            value={getPercentage(analysis.speed_hours, analysis.total_hours)} 
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  );
};
