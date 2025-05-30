
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LoadVelocityData {
  velocity: number;
  weight: number;
  exerciseName: string;
}

interface LoadVelocityChartProps {
  data: LoadVelocityData[];
  exerciseName: string;
}

export const LoadVelocityChart = ({ data, exerciseName }: LoadVelocityChartProps) => {
  // Ταξινόμηση δεδομένων από μικρότερη προς μεγαλύτερη ταχύτητα
  const sortedData = [...data].sort((a, b) => a.velocity - b.velocity);

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="text-lg">Load/Velocity Profile - {exerciseName}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={sortedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="velocity" 
              label={{ value: 'Ταχύτητα (m/s)', position: 'insideBottom', offset: -10 }}
              type="number"
              domain={['dataMin', 'dataMax']}
            />
            <YAxis 
              dataKey="weight"
              label={{ value: 'Βάρος (kg)', angle: -90, position: 'insideLeft' }}
              type="number"
              domain={['dataMin', 'dataMax']}
            />
            <Tooltip 
              formatter={(value, name) => [
                `${value}${name === 'velocity' ? ' m/s' : ' kg'}`,
                name === 'velocity' ? 'Ταχύτητα' : 'Βάρος'
              ]}
            />
            <Line 
              type="monotone" 
              dataKey="weight" 
              stroke="#2563eb" 
              strokeWidth={2}
              dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
