
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

  // Ομαδοποίηση δεδομένων ανά άσκηση
  const exerciseDataMap = new Map<string, typeof data>();
  
  data.forEach(item => {
    if (!exerciseDataMap.has(item.exerciseName)) {
      exerciseDataMap.set(item.exerciseName, []);
    }
    exerciseDataMap.get(item.exerciseName)!.push(item);
  });

  console.log('📊 Chart data:', data);
  console.log('📋 Selected exercises:', selectedExercises);
  console.log('🗺️ Exercise data map:', exerciseDataMap);

  return (
    <Card className="rounded-none">
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="velocity"
              type="number"
              domain={['dataMin', 'dataMax']}
              label={{ value: 'Ταχύτητα (m/s)', position: 'insideBottom', offset: -10, fontSize: 11 }}
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
                  const point = payload[0].payload;
                  return (
                    <div className="bg-white p-2 border border-gray-200 rounded shadow text-xs space-y-1">
                      <p className="font-medium">{point.exerciseName}</p>
                      <p>Ταχύτητα: {point.velocity} m/s</p>
                      <p>Βάρος: {point.weight} kg</p>
                      <p className="text-gray-600">Ημερομηνία: {new Date(point.date).toLocaleDateString('el-GR')}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            {selectedExercises.map((exerciseName, index) => {
              const exerciseData = Array.from(exerciseDataMap.get(exerciseName) || [])
                .sort((a, b) => a.velocity - b.velocity);
              
              console.log(`📈 Rendering line for ${exerciseName}:`, exerciseData);
              
              return (
                <Line 
                  key={exerciseName}
                  type="monotone" 
                  data={exerciseData}
                  dataKey="weight"
                  stroke={getLineColor(exerciseName, index)}
                  strokeWidth={2}
                  dot={{ strokeWidth: 2, r: 3 }}
                  name={exerciseName}
                  connectNulls
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
