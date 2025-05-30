
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
  // Sort data by velocity to create proper curve
  const sortedData = data
    .sort((a, b) => a.velocity - b.velocity)
    .map((item, index) => ({
      velocity: item.velocity,
      weight: item.weight,
      date: new Date(item.date).toLocaleDateString('el-GR'),
      test: `Τεστ ${index + 1}`
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
              dataKey="velocity"
              type="number"
              domain={[0, 'dataMax']}
              label={{ value: 'Ταχύτητα (m/s)', position: 'insideBottom', offset: -10 }}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              dataKey="weight"
              type="number"
              domain={[0, 'dataMax']}
              label={{ value: 'Βάρος (kg)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length > 0) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-gray-200 rounded shadow">
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
            <Legend />
            <Line 
              type="monotone" 
              dataKey="weight" 
              stroke="#8884d8" 
              strokeWidth={2}
              dot={{ fill: "#8884d8", strokeWidth: 2, r: 4 }}
              name={`${exerciseName} Load-Velocity`}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
