import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, X } from "lucide-react";

interface Child {
  id?: string;
  name: string;
  birth_date: string;
  is_athlete?: boolean;
  card_number?: string;
}

interface ChildrenFieldsProps {
  children: Child[];
  addChild: () => void;
  removeChild: (index: number) => void;
  updateChild: (index: number, field: keyof Child, value: any) => void;
  loading: boolean;
}

export const ChildrenFields = ({
  children,
  addChild,
  removeChild,
  updateChild,
  loading,
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Όνομα</Label>
                <Input
                  value={child.name}
                  onChange={(e) => updateChild(index, "name", e.target.value)}
                  placeholder="Όνομα παιδιού"
                  className="rounded-none h-9"
                  disabled={loading}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ημ. Γέννησης</Label>
                <Input
                  type="date"
                  value={child.birth_date}
                  onChange={(e) => updateChild(index, "birth_date", e.target.value)}
                  className="rounded-none h-9"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Label className="text-sm">Είναι αθλητής;</Label>
              <Switch
                checked={!!child.is_athlete}
                onCheckedChange={(v) => updateChild(index, "is_athlete", v)}
                disabled={loading}
              />
            </div>

            {child.is_athlete && (
              <div className="space-y-1">
                <Label className="text-xs">Αριθμός Δελτίου</Label>
                <Input
                  value={child.card_number || ""}
                  onChange={(e) => updateChild(index, "card_number", e.target.value)}
                  placeholder="π.χ. 12345"
                  className="rounded-none h-9"
                  disabled={loading}
                />
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};
