import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Wrench } from "lucide-react";

export function ToolCallCard({ name, args }: { name: string; args: any }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="rounded-none border-border p-2 text-xs">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 w-full text-left">
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <Wrench className="w-3 h-3" />
        <span className="font-mono font-medium">{name}</span>
        <Badge variant="outline" className="rounded-none text-[10px]">tool</Badge>
      </button>
      {open && (
        <pre className="mt-2 p-2 bg-muted rounded-none overflow-x-auto text-[11px]">
          {JSON.stringify(args, null, 2)}
        </pre>
      )}
    </Card>
  );
}
