
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RoleStatusFieldsProps {
  role: string;
  setRole: (value: string) => void;
  gender: string;
  setGender: (value: string) => void;
  loading: boolean;
}

export const RoleStatusFields = ({
  role, setRole,
  gender, setGender,
  loading
}: RoleStatusFieldsProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="role">Ρόλος</Label>
        <Select value={role} onValueChange={setRole} disabled={loading}>
          <SelectTrigger className="rounded-none">
            <SelectValue placeholder="Επιλέξτε ρόλο" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="coach">Coach</SelectItem>
            <SelectItem value="trainer">Trainer</SelectItem>
            <SelectItem value="athlete">Athlete</SelectItem>
            <SelectItem value="parent">Parent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="gender">Φύλο</Label>
        <Select value={gender} onValueChange={setGender} disabled={loading}>
          <SelectTrigger className="rounded-none">
            <SelectValue placeholder="Επιλέξτε φύλο" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Άνδρας</SelectItem>
            <SelectItem value="female">Γυναίκα</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
};
