
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface CombinedLoadVelocityChartProps {
  data: Array<{
    exerciseName: string;
    velocity: number;
    weight: number;
    date: string;
  }>;
}

export const CombinedLoadVelocityChart = ({ data }: CombinedLoadVelocityChartProps) => {
  // Group data by exercise name
  const exerciseGroups = data.reduce((acc, item) => {
    if (!acc[item.exerciseName]) {
      acc[item.exerciseName] = [];
    }
    acc[item.exerciseName].push({
      x: item.weight,
      y: item.velocity,
      date: item.date
    });
    return acc;
  }, {} as Record<string, Array<{ x: number; y: number; date: string }>>);

  // Colors for different exercises
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
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="Weight" 
              unit="kg"
              domain={[0, 'dataMax']}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="Velocity" 
              unit="m/s"
              domain={[0, 'dataMax']}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length > 0) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-gray-200 rounded shadow">
                      <p className="font-medium">{payload[0].payload.exerciseName}</p>
                      <p>Βάρος: {data.x} kg</p>
                      <p>Ταχύτητα: {data.y} m/s</p>
                      <p>Ημερομηνία: {new Date(data.date).toLocaleDateString('el-GR')}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            {exerciseNames.map((exerciseName, index) => (
              <Scatter
                key={exerciseName}
                name={exerciseName}
                data={exerciseGroups[exerciseName]}
                fill={colors[index % colors.length]}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
