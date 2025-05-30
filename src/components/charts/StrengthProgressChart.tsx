
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StrengthProgressChartProps {
  data: any[];
  selectedAthleteIds: string[];
}

// Χρώματα για κάθε άσκηση
const EXERCISE_COLORS: { [key: string]: string } = {
  'bench press': '#FCD34D', // κίτρινο
  'deadlift': '#EF4444', // κόκκινο
  'squat': '#3B82F6', // μπλε
  'overhead press': '#10B981', // πράσινο
  'barbell row': '#8B5CF6', // μωβ
  'pull up': '#F59E0B', // πορτοκαλί
  'dip': '#EC4899', // ροζ
  'front squat': '#06B6D4', // γαλάζιο
};

// Στυλ γραμμών για διαφορετικά τεστ
const LINE_STYLES = {
  1: { strokeDasharray: '0', strokeWidth: 3 }, // τελευταίο - συνεχής παχιά
  2: { strokeDasharray: '5,5', strokeWidth: 2 }, // προ-τελευταίο - διακεκομμένη
  3: { strokeDasharray: '2,2', strokeWidth: 2 }, // 3ο - μικρές τελείες
  4: { strokeDasharray: '10,5,2,5', strokeWidth: 1 }, // 4ο - μικτή
  5: { strokeDasharray: '1,3', strokeWidth: 1 }, // 5ο - αραιές τελείες
};

export const StrengthProgressChart = ({ data, selectedAthleteIds }: StrengthProgressChartProps) => {
  // Οργάνωση δεδομένων για το chart
  const organizeDataForChart = () => {
    const chartData: any[] = [];
    
    // Group by date
    const dateGroups = data.reduce((acc, item) => {
      const dateKey = item.testDate;
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(item);
      return acc;
    }, {});

    Object.entries(dateGroups).forEach(([date, items]: [string, any]) => {
      const dataPoint: any = { date: new Date(date).toLocaleDateString('el-GR') };
      
      items.forEach((item: any) => {
        const key = `${item.exerciseName}_${item.athleteName}_test${item.testIndex}`;
        dataPoint[key] = item.weight;
      });
      
      chartData.push(dataPoint);
    });

    return chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const chartData = organizeDataForChart();

  // Δημιουργία των γραμμών για το chart
  const generateLines = () => {
    const lines: JSX.Element[] = [];
    const processedKeys = new Set();

    data.forEach(item => {
      const exerciseKey = item.exerciseName.toLowerCase();
      const color = EXERCISE_COLORS[exerciseKey] || '#6B7280';
      const lineStyle = LINE_STYLES[item.testIndex as keyof typeof LINE_STYLES] || LINE_STYLES[1];
      
      const lineKey = `${item.exerciseName}_${item.athleteName}_test${item.testIndex}`;
      
      if (!processedKeys.has(lineKey)) {
        processedKeys.add(lineKey);
        
        lines.push(
          <Line
            key={lineKey}
            type="monotone"
            dataKey={lineKey}
            stroke={color}
            strokeDasharray={lineStyle.strokeDasharray}
            strokeWidth={lineStyle.strokeWidth}
            dot={{ fill: color, strokeWidth: 2, r: 4 }}
            name={`${item.exerciseName} - ${item.athleteName} (${item.testIndex === 1 ? 'Τελευταίο' : `${item.testIndex}ο`})`}
          />
        );
      }
    });

    return lines;
  };

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Δεν υπάρχουν δεδομένα για εμφάνιση</p>
      </div>
    );
  }

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle>Πρόοδος Δύναμης</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={500}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
            />
            <YAxis 
              label={{ value: 'Βάρος (kg)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              labelFormatter={(value) => `Ημερομηνία: ${value}`}
              formatter={(value, name) => [`${value} kg`, name]}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            {generateLines()}
          </LineChart>
        </ResponsiveContainer>
        
        {/* Επεξήγηση χρωμάτων */}
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h4 className="font-medium mb-2">Χρώματα Ασκήσεων:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            {Object.entries(EXERCISE_COLORS).map(([exercise, color]) => (
              <div key={exercise} className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded" 
                  style={{ backgroundColor: color }}
                />
                <span className="capitalize">{exercise}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
