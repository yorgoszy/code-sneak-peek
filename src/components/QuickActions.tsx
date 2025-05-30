
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const quickActions = [
  {
    title: "Γρήγορες ενέργειες",
    subtitle: "",
    color: "text-blue-600"
  },
  {
    title: "Δημιουργία Προγράμματος",
    subtitle: "Δημιουργήστε νέο πρόγραμμα προπόνησης",
    color: "text-green-600"
  },
  {
    title: "Προσθήκη Αθλητή",
    subtitle: "Εγγραφή νέου αθλητή",
    color: "text-purple-600"
  },
  {
    title: "Νέα Άσκηση",
    subtitle: "Προσθήκη άσκησης στη βιβλιοθήκη",
    color: "text-orange-600"
  }
];

export const QuickActions = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {quickActions.slice(1).map((action, index) => (
            <div key={index} className="flex flex-col space-y-1">
              <Button variant="outline" className="justify-start rounded-none text-left h-auto py-3">
                <div>
                  <p className={`text-sm font-medium ${action.color}`}>{action.title}</p>
                  <p className="text-xs text-gray-500">{action.subtitle}</p>
                </div>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
