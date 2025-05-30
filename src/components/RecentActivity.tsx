
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const activityData = [
  {
    title: "Νέος αθλητής εγγράφηκε στο σύστημα",
    time: "29/05/2025 14:42"
  },
  {
    title: "Νέο πρόγραμμα δημιουργήθηκε",
    time: "30/05/2025 12:32"
  },
  {
    title: "Νέα άσκηση προστέθηκε στη βιβλιοθήκη",
    time: "27/05/2025 14:42"
  },
  {
    title: "Το σύστημα ενημερώθηκε με νέες λειτουργίες",
    time: "25/05/2025 14:42"
  }
];

export const RecentActivity = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activityData.map((activity, index) => (
            <div key={index} className="flex flex-col space-y-1">
              <p className="text-sm font-medium text-gray-900">{activity.title}</p>
              <p className="text-xs text-gray-500">{activity.time}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
