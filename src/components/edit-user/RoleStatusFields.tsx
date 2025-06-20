
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
  userStatus: string;
  setUserStatus: (value: string) => void;
  subscriptionStatus: string;
  setSubscriptionStatus: (value: string) => void;
  loading: boolean;
}

export const RoleStatusFields = ({
  role, setRole,
  userStatus, setUserStatus,
  subscriptionStatus, setSubscriptionStatus,
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
            <SelectItem value="trainer">Trainer</SelectItem>
            <SelectItem value="athlete">Athlete</SelectItem>
            <SelectItem value="parent">Parent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="userStatus">Κατάσταση Χρήστη</Label>
        <Select value={userStatus} onValueChange={setUserStatus} disabled={loading}>
          <SelectTrigger className="rounded-none">
            <SelectValue placeholder="Επιλέξτε κατάσταση" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subscriptionStatus">Κατάσταση Συνδρομής</Label>
        <Select value={subscriptionStatus} onValueChange={setSubscriptionStatus} disabled={loading}>
          <SelectTrigger className="rounded-none">
            <SelectValue placeholder="Επιλέξτε κατάσταση συνδρομής" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
};
