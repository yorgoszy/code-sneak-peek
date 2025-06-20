
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface TestsAthleteDateSelectorProps {
  selectedAthleteId: string;
  setSelectedAthleteId: (id: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  users: { id: string; name: string }[];
  handleSaveAllTests: () => void;
  saving?: boolean;
}

export const TestsAthleteDateSelector: React.FC<TestsAthleteDateSelectorProps> = ({
  selectedAthleteId,
  setSelectedAthleteId,
  selectedDate,
  setSelectedDate,
  users,
  handleSaveAllTests,
  saving = false,
}) => (
  <Card className="rounded-none mb-6">
    <CardHeader>
      <CardTitle>Επιλογή Αθλητή και Ημερομηνίας</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
        <div>
          <Label>Αθλητής</Label>
          <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
            <SelectTrigger className="rounded-none">
              <SelectValue placeholder="Επιλέξτε αθλητή για τα τεστ" />
            </SelectTrigger>
            <SelectContent>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Ημερομηνία Τεστ</Label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-none"
          />
        </div>
        <div className="flex items-end">
          <Button
            onClick={handleSaveAllTests}
            className="rounded-none w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
            disabled={!selectedAthleteId || saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Αποθήκευση...
              </>
            ) : (
              'Αποθήκευση Όλων των Τεστ'
            )}
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);
