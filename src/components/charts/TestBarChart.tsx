
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TestBarChartProps {
  data: Array<{
    name: string;
    value: number;
    unit?: string;
    color?: string;
  }>;
  title: string;
  color?: string;
}

export const TestBarChart = ({ data, title, color = "#2563eb" }: TestBarChartProps) => {
  return (
    <Card className="rounded-none">
      <CardHeader className="p-3">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={data} barSize={5}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={60}
              fontSize={10}
            />
            <YAxis fontSize={10} />
            <Tooltip 
              formatter={(value, name, props) => [
                `${value}${props.payload.unit || ''}`,
                'Αποτέλεσμα'
              ]}
            />
            <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
