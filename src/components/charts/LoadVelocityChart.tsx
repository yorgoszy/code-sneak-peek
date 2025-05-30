
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
  // Sort data by date to show progression
  const sortedData = data
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((item, index) => ({
      test: `Τεστ ${index + 1}`,
      date: new Date(item.date).toLocaleDateString('el-GR'),
      weight: item.weight,
      velocity: item.velocity
    }));

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle>{exerciseName} - Load/Velocity Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={sortedData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="test"
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
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-gray-200 rounded shadow">
                      <p className="font-medium">{label}</p>
                      <p>Ημερομηνία: {data.date}</p>
                      <p>Βάρος: {data.weight} kg</p>
                      <p>Ταχύτητα: {data.velocity} m/s</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Line 
              yAxisId="weight"
              type="monotone" 
              dataKey="weight" 
              stroke="#8884d8" 
              strokeWidth={2}
              dot={{ fill: "#8884d8", strokeWidth: 2, r: 4 }}
              name="Βάρος (kg)"
            />
            <Line 
              yAxisId="velocity"
              type="monotone" 
              dataKey="velocity" 
              stroke="#82ca9d" 
              strokeWidth={2}
              dot={{ fill: "#82ca9d", strokeWidth: 2, r: 4 }}
              name="Ταχύτητα (m/s)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
