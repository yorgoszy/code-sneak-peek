
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CartesianGrid, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface CombinedLoadVelocityChartProps {
  data: Array<{
    exerciseName: string;
    velocity: number;
    weight: number;
    date: string;
  }>;
}

export const CombinedLoadVelocityChart = ({ data }: CombinedLoadVelocityChartProps) => {
  // Group data by exercise and sort by velocity
  const exerciseGroups = data.reduce((acc, item) => {
    if (!acc[item.exerciseName]) {
      acc[item.exerciseName] = [];
    }
    acc[item.exerciseName].push({
      velocity: item.velocity,
      weight: item.weight,
      date: item.date
    });
    return acc;
  }, {} as Record<string, Array<{ velocity: number; weight: number; date: string }>>);

  // Create combined dataset for all exercises
  const allDataPoints: Array<{ velocity: number; weight: number; exerciseName: string; date: string }> = [];
  
  Object.entries(exerciseGroups).forEach(([exerciseName, exerciseData]) => {
    exerciseData.forEach(point => {
      allDataPoints.push({
        velocity: point.velocity,
        weight: point.weight,
        exerciseName: exerciseName,
        date: point.date
      });
    });
  });

  // Sort by velocity for proper curve display
  const sortedData = allDataPoints.sort((a, b) => a.velocity - b.velocity);

  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', 
    '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98'
  ];

  const exerciseNames = Object.keys(exerciseGroups);

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle>Load/Velocity Profile - Συνδυασμένη Ανάλυση</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={500}>
          <LineChart data={sortedData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="velocity"
              type="number"
              domain={['dataMin', 'dataMax']}
              label={{ value: 'Ταχύτητα (m/s)', position: 'insideBottom', offset: -10 }}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              dataKey="weight"
              type="number"
              domain={['dataMin', 'dataMax']}
              label={{ value: 'Βάρος (kg)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length > 0) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-gray-200 rounded shadow">
                      <p className="font-medium">{data.exerciseName}</p>
                      <p>Ημερομηνία: {new Date(data.date).toLocaleDateString('el-GR')}</p>
                      <p>Ταχύτητα: {data.velocity} m/s</p>
                      <p>Βάρος: {data.weight} kg</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            {exerciseNames.map((exerciseName, index) => {
              const exerciseData = sortedData.filter(d => d.exerciseName === exerciseName);
              return (
                <Line
                  key={exerciseName}
                  data={exerciseData}
                  type="monotone"
                  dataKey="weight"
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                  name={exerciseName}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
