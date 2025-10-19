import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, X } from "lucide-react";

interface Child {
  id?: string;
  name: string;
  birth_date: string;
}

interface ChildrenFieldsProps {
  children: Child[];
  addChild: () => void;
  removeChild: (index: number) => void;
  updateChild: (index: number, field: keyof Child, value: string) => void;
  loading: boolean;
}

export const ChildrenFields = ({
  children,
  addChild,
  removeChild,
  updateChild,
  loading
}: ChildrenFieldsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Παιδιά</Label>
        <Button
          type="button"
          onClick={addChild}
          variant="outline"
          size="sm"
          className="rounded-none"
          disabled={loading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Προσθήκη Παιδιού
        </Button>
      </div>

      {children.length === 0 && (
        <p className="text-sm text-gray-500">Δεν έχουν προστεθεί παιδιά</p>
      )}

      {children.map((child, index) => (
        <Card key={index} className="p-4 rounded-none">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Παιδί {index + 1}</Label>
              <Button
                type="button"
                onClick={() => removeChild(index)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-none text-red-600 hover:text-red-700 hover:bg-red-50"
                disabled={loading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`child-name-${index}`} className="text-sm">
                Όνομα Παιδιού
              </Label>
              <Input
                id={`child-name-${index}`}
                value={child.name}
                onChange={(e) => updateChild(index, 'name', e.target.value)}
                placeholder="Εισάγετε το όνομα του παιδιού"
                className="rounded-none"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`child-birth-date-${index}`} className="text-sm">
                Ημερομηνία Γέννησης
              </Label>
              <Input
                id={`child-birth-date-${index}`}
                type="date"
                value={child.birth_date}
                onChange={(e) => updateChild(index, 'birth_date', e.target.value)}
                className="rounded-none"
                disabled={loading}
              />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
