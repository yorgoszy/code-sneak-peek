
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
    <Card className="w-full max-w-full rounded-none">
      <CardHeader className="p-2 sm:p-6">
        <CardTitle className="text-base sm:text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-2 sm:p-6">
        <div className="space-y-2 sm:space-y-4">
          {activityData.map((activity, index) => (
            <div key={index} className="flex flex-col space-y-0.5 sm:space-y-1">
              <p className="text-xs sm:text-sm font-medium text-gray-900">{activity.title}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">{activity.time}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
