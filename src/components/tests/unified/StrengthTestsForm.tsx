
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface StrengthTestsFormProps {
  data: any;
  onChange: (data: any) => void;
  selectedAthleteId: string;
  selectedDate: string;
}

export const StrengthTestsForm = ({ data, onChange, selectedAthleteId, selectedDate }: StrengthTestsFormProps) => {
  const [strengthSessions, setStrengthSessions] = useState(data.sessions || []);

  const handleStrengthDataChange = (sessions: any[]) => {
    setStrengthSessions(sessions);
    onChange({ ...data, sessions });
  };

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle>Τεστ Δύναμης</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-4 text-gray-600">
          <p>Τα τεστ δύναμης θα ενσωματωθούν στην ενιαία συνεδρία στην επόμενη ενημέρωση.</p>
          <p>Προς το παρόν μπορείτε να χρησιμοποιήσετε το ξεχωριστό tab "Δύναμη".</p>
        </div>
      </CardContent>
    </Card>
  );
};
