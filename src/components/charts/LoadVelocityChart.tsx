
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CartesianGrid, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface LoadVelocityChartProps {
  data: Array<{
    exerciseName: string;
    velocity: number;
    weight: number;
    date: string;
  }>;
  exerciseName: string;
}

export const LoadVelocityChart = ({ data, exerciseName }: LoadVelocityChartProps) => {
  // Sort by velocity (X-axis) from smallest to largest
  const sortedData = [...data]
    .sort((a, b) => a.velocity - b.velocity)
    .map((item, index) => ({
      velocity: item.velocity,
      weight: item.weight,
      date: new Date(item.date).toLocaleDateString('el-GR'),
      test: `Τεστ ${index + 1}`
    }));

  // Συνάρτηση για να επιλέξει χρώμα βάσει άσκησης
  const getLineColor = (name: string) => {
    const normalizedName = name.toLowerCase();
    
    if (normalizedName.includes('deadlift') || normalizedName.includes('dl')) {
      return '#ef4444'; // κόκκινο
    }
    if (normalizedName.includes('squat') || normalizedName.includes('sq')) {
      return '#eab308'; // κίτρινο
    }
    if (normalizedName.includes('bench press') || normalizedName.includes('bp')) {
      return '#3b82f6'; // μπλε
    }
    return '#00ffba'; // default πράσινο
  };

  const lineColor = getLineColor(exerciseName);

  return (
    <Card className="rounded-none">
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={sortedData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
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
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-2 border border-gray-200 rounded shadow text-xs">
                      <p className="font-medium">{data.test}</p>
                      <p>Ημερομηνία: {data.date}</p>
                      <p>Ταχύτητα: {data.velocity} m/s</p>
                      <p>Βάρος: {data.weight} kg</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line 
              type="monotone" 
              dataKey="weight" 
              stroke={lineColor}
              strokeWidth={2}
              dot={{ fill: lineColor, strokeWidth: 2, r: 3 }}
              name="Load-Velocity"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
