
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CartesianGrid, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface LoadVelocityChartProps {
  data: Array<{
    exerciseName: string;
    exerciseId?: string;
    velocity: number;
    weight: number;
    date: string;
    sessionId?: string;
  }>;
  selectedExercises: string[];
  exerciseSessions?: Record<string, any[]>;
  selectedSessions?: Record<string, string[]>;
}

export const LoadVelocityChart = ({ data, selectedExercises, exerciseSessions = {}, selectedSessions = {} }: LoadVelocityChartProps) => {
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

  // Προσδιορισμός strokeDasharray βάσει του session index
  const getStrokeDasharray = (exerciseId: string, sessionId: string) => {
    const sessions = exerciseSessions[exerciseId] || [];
    const sessionIndex = sessions.findIndex(s => s.sessionId === sessionId);
    
    // 0 = πιο πρόσφατο (συνεχής γραμμή)
    // 1 = προηγούμενο (διακεκομμένη: "5 5")
    // 2 = πιο προηγούμενο (τελείες και διακεκομμένη: "1 3")
    // 3+ = πιο παλιά (τελείες: "1 5")
    
    if (sessionIndex === 0) return "0"; // συνεχής
    if (sessionIndex === 1) return "5 5"; // διακεκομμένη
    if (sessionIndex === 2) return "1 3"; // τελείες και διακεκομμένη
    return "1 5"; // τελείες
  };

  // Ομαδοποίηση δεδομένων ανά άσκηση και session
  const groupedData: Record<string, Record<string, typeof data>> = {};
  data.forEach(item => {
    const key = item.exerciseName;
    const sessionKey = item.sessionId || 'default';
    if (!groupedData[key]) {
      groupedData[key] = {};
    }
    if (!groupedData[key][sessionKey]) {
      groupedData[key][sessionKey] = [];
    }
    groupedData[key][sessionKey].push(item);
  });

  // Δημιουργία ενοποιημένων δεδομένων για το γράφημα
  const allVelocities = [...new Set(data.map(d => d.velocity))].sort((a, b) => a - b);
  const chartData = allVelocities.map(velocity => {
    const point: any = { velocity };
    data.forEach(item => {
      if (item.velocity === velocity) {
        const rawSessionKey = item.sessionId ? String(item.sessionId) : 'default';
        const sessionKey = `${item.exerciseName}_${rawSessionKey}`;
        point[sessionKey] = item.weight;
        point[`${sessionKey}_date`] = new Date(item.date).toLocaleDateString('el-GR');
      }
    });
    return point;
  });

  return (
    <Card className="rounded-none max-w-2xl">
      <CardContent className="p-0">
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={chartData} margin={{ top: 1, right: 10, bottom: 1, left: 1 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="velocity"
              type="number"
              domain={[0, 1.5]}
              tick={{ fontSize: 8 }}
            />
            <YAxis 
              type="number"
              domain={[0, 300]}
              tick={{ fontSize: 8 }}
              tickCount={7}
              allowDecimals={false}
              axisLine={true}
              tickLine={true}
              width={25}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length > 0) {
                  const first: any = payload[0];
                  const dateKey = `${first.dataKey}_date`;
                  const dateVal = first?.payload?.[dateKey];
                  return (
                    <div className="bg-white p-1.5 border border-gray-200 rounded shadow text-[10px] space-y-0.5">
                      <p className="font-medium">Ταχύτητα: {first.payload.velocity} m/s</p>
                      <p className="text-gray-600">Ημερομηνία: {dateVal ?? '-'}</p>
                      {payload.map((entry: any, index: number) => (
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
            {/* Legend removed to save space */}
            {/* Only show last 2 sessions per exercise for 1RM comparison */}
            {selectedExercises.map((exerciseName, index) => {
              const exerciseData = data.filter(d => d.exerciseName === exerciseName);
              const exerciseId = exerciseData[0]?.exerciseId;
              const allSessions = exerciseSessions[exerciseId || ''] || [];
              
              // Πάρε μόνο τις 2 τελευταίες μετρήσεις (sessions)
              const lastTwoSessions = allSessions.slice(0, 2).map(s => s.sessionId);
              
              // Αν υπάρχουν selected sessions, φιλτράρισε μόνο τις τελευταίες 2
              const sessions = selectedSessions[exerciseId || ''];
              const sessionIds = sessions && sessions.length > 0 
                ? sessions.filter(s => lastTwoSessions.includes(s))
                : lastTwoSessions;
              
              if (sessionIds.length === 0) {
                // Fallback: εμφάνισε μια γραμμή χωρίς session ID
                return (
                  <Line 
                    key={exerciseName}
                    type="monotone" 
                    dataKey={`${exerciseName}_${exerciseData[0]?.sessionId || 'default'}`}
                    stroke={getLineColor(exerciseName, index)}
                    strokeWidth={1.5}
                    dot={{ strokeWidth: 1.5, r: 2 }}
                    name={exerciseName}
                    connectNulls
                  />
                );
              }
              
              return sessionIds.map(sessionId => {
                const sessionKey = `${exerciseName}_${sessionId}`;
                // Μόνο αν έχουμε selected sessions, χρησιμοποιούμε διακεκομμένες γραμμές
                const dashArray = sessions && sessions.length > 0 ? getStrokeDasharray(exerciseId || '', sessionId || '') : "0";
                
                return (
                  <Line 
                    key={sessionKey}
                    type="monotone" 
                    dataKey={sessionKey}
                    stroke={getLineColor(exerciseName, index)}
                    strokeWidth={1.5}
                    strokeDasharray={dashArray}
                    dot={{ strokeWidth: 1.5, r: 2 }}
                    name={exerciseName}
                    connectNulls
                  />
                );
              });
            })}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
