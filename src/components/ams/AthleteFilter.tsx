import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, ChevronsUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Athlete {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url?: string | null;
}

interface Props {
  coachId?: string | null;
  value: string[]; // selected athlete ids
  onChange: (ids: string[]) => void;
  mode?: "single" | "multi" | "position";
  placeholder?: string;
}

const stripAccents = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export const AthleteFilter: React.FC<Props> = ({ coachId, value, onChange, mode = "multi", placeholder = "Athletes" }) => {
  const [open, setOpen] = React.useState(false);

  const { data: athletes = [] } = useQuery({
    queryKey: ["ams", "athletes", coachId ?? null],
    queryFn: async () => {
      let q = supabase.from("app_users").select("id,name,email,avatar_url").order("name");
      if (coachId) q = q.eq("coach_id", coachId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Athlete[];
    },
  });

  const toggle = (id: string) => {
    if (mode === "single") {
      onChange([id]);
      setOpen(false);
      return;
    }
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  const label =
    value.length === 0
      ? placeholder
      : value.length === 1
      ? athletes.find((a) => a.id === value[0])?.name ?? "1 selected"
      : `${value.length} selected`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="rounded-none justify-between min-w-[220px]">
          {label}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0 rounded-none" align="start">
        <Command
          filter={(val, search) => {
            const a = athletes.find((x) => x.id === val);
            if (!a) return 0;
            const hay = stripAccents(`${a.name ?? ""} ${a.email ?? ""}`);
            return hay.includes(stripAccents(search)) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Search name or email…" />
          <CommandList>
            <CommandEmpty>No athletes.</CommandEmpty>
            <CommandGroup>
              {athletes.map((a) => {
                const selected = value.includes(a.id);
                return (
                  <CommandItem key={a.id} value={a.id} onSelect={() => toggle(a.id)}>
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage src={a.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs">{(a.name ?? "?").charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm">{a.name}</span>
                      <span className="text-xs text-muted-foreground">{a.email}</span>
                    </div>
                    {selected && <Check className="ml-auto h-4 w-4" />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
