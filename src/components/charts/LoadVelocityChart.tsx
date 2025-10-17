
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CartesianGrid, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface LoadVelocityChartProps {
  data: Array<{
    exerciseName: string;
    exerciseId?: string;
    velocity: number;
    weight: number;
    date: string;
  }>;
  selectedExercises: string[];
}

export const LoadVelocityChart = ({ data, selectedExercises }: LoadVelocityChartProps) => {
  // Ομαδοποίηση δεδομένων ανά άσκηση
  const exerciseGroups = data.reduce((acc, item) => {
    if (!acc[item.exerciseName]) {
      acc[item.exerciseName] = [];
    }
    acc[item.exerciseName].push(item);
    return acc;
  }, {} as Record<string, typeof data>);

  // Συνάρτηση για να επιλέξει χρώμα βάσει άσκησης
  const getLineColor = (name: string, index: number) => {
    const normalizedName = name.toLowerCase();
    
    if (normalizedName.includes('deadlift') || normalizedName.includes('dl')) {
      return '#ef4444'; // κόκκινο
    }
    if (normalizedName.includes('squat') || normalizedName.includes('sq')) {
      return '#3b82f6'; // μπλε
    }
    if (normalizedName.includes('bench press') || normalizedName.includes('bp')) {
      return '#eab308'; // κίτρινο
    }
    
    // Χρώματα για πολλαπλές ασκήσεις
    const colors = ['#00ffba', '#cb8954', '#ef4444', '#3b82f6', '#eab308', '#8b5cf6', '#ec4899'];
    return colors[index % colors.length];
  };

  // Ενοποιημένα δεδομένα για το γράφημα
  const chartData = data
    .sort((a, b) => a.velocity - b.velocity)
    .reduce((acc, item) => {
      const existing = acc.find(d => d.velocity === item.velocity);
      if (existing) {
        existing[item.exerciseName] = item.weight;
      } else {
        acc.push({
          velocity: item.velocity,
          [item.exerciseName]: item.weight,
          date: new Date(item.date).toLocaleDateString('el-GR')
        });
      }
      return acc;
    }, [] as any[]);

  return (
    <Card className="rounded-none max-w-2xl">
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 50, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="velocity"
              type="number"
              domain={['dataMin', 'dataMax']}
              label={{ value: 'Ταχύτητα (m/s)', position: 'insideBottom', offset: -5, fontSize: 11 }}
              tick={{ fontSize: 10 }}
            />
            <YAxis 
              type="number"
              domain={['dataMin', 'dataMax']}
              label={{ value: 'Βάρος (kg)', angle: -90, position: 'insideLeft', fontSize: 11 }}
              tick={{ fontSize: 10 }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length > 0) {
                  return (
                    <div className="bg-white p-2 border border-gray-200 rounded shadow text-xs space-y-1">
                      <p className="font-medium">Ταχύτητα: {payload[0].payload.velocity} m/s</p>
                      <p className="text-gray-600">Ημερομηνία: {payload[0].payload.date}</p>
                      {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }}>
                          {entry.name}: {entry.value} kg
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '10px' }} />
            {selectedExercises.map((exerciseName, index) => (
              <Line 
                key={exerciseName}
                type="monotone" 
                dataKey={exerciseName} 
                stroke={getLineColor(exerciseName, index)}
                strokeWidth={2}
                dot={{ strokeWidth: 2, r: 3 }}
                name={exerciseName}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
