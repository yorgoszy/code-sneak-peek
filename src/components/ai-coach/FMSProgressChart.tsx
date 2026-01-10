import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAICoachResults } from '@/hooks/useAICoachResults';
import { TrendingUp, Calendar, Target } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar } from 'recharts';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';

interface FMSProgressChartProps {
  userId: string;
}

const FMS_TEST_LABELS: Record<string, string> = {
  'deep-squat': 'Deep Squat',
  'hurdle-step': 'Hurdle Step',
  'inline-lunge': 'Inline Lunge',
  'shoulder-mobility': 'Shoulder Mobility',
  'active-straight-leg-raise': 'Leg Raise',
  'trunk-stability-pushup': 'Trunk Stability',
  'rotary-stability': 'Rotary Stability'
};

const chartConfig = {
  score: {
    label: "Score",
    color: "hsl(var(--primary))",
  },
};

export const FMSProgressChart: React.FC<FMSProgressChartProps> = ({ userId }) => {
  const { loading, getFMSSummary, fetchUserResults, results } = useAICoachResults();
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  const loadData = async () => {
    const [summaryData] = await Promise.all([
      getFMSSummary(userId),
      fetchUserResults(userId)
    ]);
    setSummary(summaryData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!summary || summary.testsCompleted === 0) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Δεν υπάρχουν αποτελέσματα FMS tests ακόμα.</p>
          <p className="text-sm mt-2">Ολοκλήρωσε tests με τον AI Coach για να δεις την πρόοδό σου.</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare radar chart data
  const radarData = Object.entries(summary.tests)
    .filter(([_, value]) => value !== null)
    .map(([key, value]: [string, any]) => ({
      test: FMS_TEST_LABELS[key] || key,
      score: value.score,
      fullMark: 3
    }));

  // Prepare bar chart data for current scores
  const barData = Object.entries(summary.tests)
    .map(([key, value]: [string, any]) => ({
      test: FMS_TEST_LABELS[key]?.split(' ')[0] || key,
      score: value?.score || 0,
      fill: value?.score === 3 ? 'hsl(var(--primary))' : 
            value?.score === 2 ? 'hsl(142 76% 36%)' : 
            value?.score === 1 ? 'hsl(38 92% 50%)' : 'hsl(var(--muted))'
    }));

  // Prepare line chart data for history (group by date)
  const historyByDate = results.reduce((acc: any, result: any) => {
    const date = result.test_date;
    if (!acc[date]) {
      acc[date] = { date, total: 0, count: 0 };
    }
    acc[date].total += result.score;
    acc[date].count += 1;
    return acc;
  }, {});

  const lineData = Object.values(historyByDate)
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-10)
    .map((item: any) => ({
      date: format(new Date(item.date), 'dd MMM', { locale: el }),
      score: item.total
    }));

  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="rounded-none">
          <CardContent className="p-4 text-center">
            <div className={`text-3xl font-bold ${getScoreColor(summary.totalScore, summary.maxScore)}`}>
              {summary.totalScore}/{summary.maxScore}
            </div>
            <p className="text-sm text-muted-foreground">Συνολικό Score</p>
          </CardContent>
        </Card>
        
        <Card className="rounded-none">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-primary">
              {summary.testsCompleted}/{summary.totalTests}
            </div>
            <p className="text-sm text-muted-foreground">Tests Ολοκληρωμένα</p>
          </CardContent>
        </Card>
        
        <Card className="rounded-none">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold">
              {summary.testsCompleted > 0 
                ? (summary.totalScore / summary.testsCompleted).toFixed(1)
                : '-'}
            </div>
            <p className="text-sm text-muted-foreground">Μέσος Όρος</p>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart - Current Scores */}
      <Card className="rounded-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="w-4 h-4" />
            Τρέχοντα FMS Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart data={barData} layout="horizontal">
              <XAxis dataKey="test" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 3]} ticks={[0, 1, 2, 3]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="score" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Radar Chart */}
      {radarData.length >= 3 && (
        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              FMS Radar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="test" tick={{ fontSize: 9 }} />
                <PolarRadiusAxis domain={[0, 3]} tick={{ fontSize: 10 }} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Line Chart - Progress Over Time */}
      {lineData.length > 1 && (
        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Εξέλιξη Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <LineChart data={lineData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent Results List */}
      <Card className="rounded-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Πρόσφατα Αποτελέσματα</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {results.slice(0, 10).map((result: any) => (
              <div key={result.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-none">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-none text-xs">
                    {FMS_TEST_LABELS[result.test_type] || result.test_type}
                  </Badge>
                  {result.test_side && (
                    <span className="text-xs text-muted-foreground">
                      ({result.test_side === 'left' ? 'Αριστερά' : 'Δεξιά'})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    className={`rounded-none ${
                      result.score === 3 ? 'bg-green-500' :
                      result.score === 2 ? 'bg-yellow-500' :
                      result.score === 1 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                  >
                    {result.score}/3
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(result.test_date), 'dd/MM/yy')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
