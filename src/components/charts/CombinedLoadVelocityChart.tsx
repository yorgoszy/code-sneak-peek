
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
  // Group data by exercise and sort by date
  const exerciseGroups = data.reduce((acc, item) => {
    if (!acc[item.exerciseName]) {
      acc[item.exerciseName] = [];
    }
    acc[item.exerciseName].push({
      date: item.date,
      weight: item.weight,
      velocity: item.velocity
    });
    return acc;
  }, {} as Record<string, Array<{ date: string; weight: number; velocity: number }>>);

  // Sort each exercise data by date and create combined dataset
  const exerciseNames = Object.keys(exerciseGroups);
  const allDates = [...new Set(data.map(d => d.date))].sort();
  
  const chartData = allDates.map(date => {
    const dataPoint: any = { date: new Date(date).toLocaleDateString('el-GR') };
    
    exerciseNames.forEach(exerciseName => {
      const exerciseData = exerciseGroups[exerciseName].find(d => d.date === date);
      if (exerciseData) {
        dataPoint[`${exerciseName}_weight`] = exerciseData.weight;
        dataPoint[`${exerciseName}_velocity`] = exerciseData.velocity;
      }
    });
    
    return dataPoint;
  });

  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', 
    '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98'
  ];

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle>Load/Velocity Profile - Συνδυασμένη Ανάλυση</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={500}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="weight"
              orientation="left"
              label={{ value: 'Βάρος (kg)', angle: -90, position: 'insideLeft' }}
            />
            <YAxis 
              yAxisId="velocity"
              orientation="right"
              label={{ value: 'Ταχύτητα (m/s)', angle: 90, position: 'insideRight' }}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length > 0) {
                  return (
                    <div className="bg-white p-3 border border-gray-200 rounded shadow">
                      <p className="font-medium">Ημερομηνία: {label}</p>
                      {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }}>
                          {entry.name}: {entry.value} {entry.name?.includes('weight') ? 'kg' : 'm/s'}
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            {exerciseNames.map((exerciseName, index) => (
              <React.Fragment key={exerciseName}>
                <Line
                  yAxisId="weight"
                  type="monotone"
                  dataKey={`${exerciseName}_weight`}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                  name={`${exerciseName} (Βάρος)`}
                  connectNulls={false}
                />
                <Line
                  yAxisId="velocity"
                  type="monotone"
                  dataKey={`${exerciseName}_velocity`}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                  name={`${exerciseName} (Ταχύτητα)`}
                  connectNulls={false}
                />
              </React.Fragment>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
