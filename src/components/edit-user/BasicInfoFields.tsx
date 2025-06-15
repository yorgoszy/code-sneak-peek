
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BasicInfoFieldsProps {
  name: string;
  setName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  birthDate: string;
  setBirthDate: (value: string) => void;
  loading: boolean;
}

export const BasicInfoFields = ({
  name, setName,
  email, setEmail,
  phone, setPhone,
  category, setCategory,
  birthDate, setBirthDate,
  loading
}: BasicInfoFieldsProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Όνομα *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Εισάγετε το όνομα"
          className="rounded-none"
          disabled={loading}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Εισάγετε το email"
          className="rounded-none"
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Τηλέφωνο</Label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Εισάγετε το τηλέφωνο"
          className="rounded-none"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Κατηγορία</Label>
        <Input
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Εισάγετε την κατηγορία"
          className="rounded-none"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthDate">Ημερομηνία Γέννησης</Label>
        <Input
          id="birthDate"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          className="rounded-none"
          disabled={loading}
        />
      </div>
    </>
  );
};
