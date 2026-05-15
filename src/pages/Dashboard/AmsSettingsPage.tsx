import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { Sidebar } from "@/components/Sidebar";
import { CoachSidebar } from "@/components/CoachSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Menu, Plus, Pencil, Trash2, Info } from "lucide-react";
import { toast } from "sonner";

interface FlagRow { id: string; flag_key: string; enabled: boolean; description: string | null; }
interface BandRow {
  id: string; coach_id: string | null; metric_key: string;
  position_or_group: string | null; sport: string | null; age_group: string | null;
  green_min: number | null; green_max: number | null;
  yellow_min: number | null; yellow_max: number | null;
  red_min: number | null; red_max: number | null;
  notes: string | null; source: string | null;
}

const emptyBand: Partial<BandRow> = {
  metric_key: "", position_or_group: null, sport: null, age_group: null,
  green_min: null, green_max: null, yellow_min: null, yellow_max: null, red_min: null, red_max: null,
  notes: null, source: null,
};

const FlagsTab: React.FC = () => {
  const qc = useQueryClient();
  const { data: flags = [] } = useQuery({
    queryKey: ["ams", "flags"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("feature_flags").select("*").order("flag_key");
      if (error) throw error;
      return (data ?? []) as FlagRow[];
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await (supabase as any).from("feature_flags").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ams", "flags"] });
      qc.invalidateQueries({ queryKey: ["ams", "feature_flag"] });
      toast.success("Flag updated");
    },
    onError: (e: any) => toast.error(e.message ?? "Update failed"),
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Flag</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="w-[120px]">Enabled</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {flags.map((f) => (
          <TableRow key={f.id}>
            <TableCell className="font-mono text-sm">{f.flag_key}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{f.description}</TableCell>
            <TableCell>
              <Switch checked={f.enabled} onCheckedChange={(v) => toggle.mutate({ id: f.id, enabled: v })} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const BandsTab: React.FC = () => {
  const qc = useQueryClient();
  const [filter, setFilter] = useState({ metric: "", position: "", age: "" });
  const [editing, setEditing] = useState<Partial<BandRow> | null>(null);

  const { data: bands = [] } = useQuery({
    queryKey: ["ams", "bands"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("performance_bands").select("*").order("metric_key");
      if (error) throw error;
      return (data ?? []) as BandRow[];
    },
  });

  const filtered = bands.filter((b) =>
    (!filter.metric || b.metric_key.toLowerCase().includes(filter.metric.toLowerCase())) &&
    (!filter.position || (b.position_or_group ?? "").toLowerCase().includes(filter.position.toLowerCase())) &&
    (!filter.age || (b.age_group ?? "").toLowerCase().includes(filter.age.toLowerCase()))
  );

  const save = useMutation({
    mutationFn: async (row: Partial<BandRow>) => {
      const payload: any = { ...row };
      delete payload.id;
      if (row.id) {
        const { error } = await (supabase as any).from("performance_bands").update(payload).eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("performance_bands").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ams", "bands"] });
      qc.invalidateQueries({ queryKey: ["ams", "band"] });
      setEditing(null);
      toast.success("Band saved");
    },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("performance_bands").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ams", "bands"] });
      toast.success("Band deleted");
    },
    onError: (e: any) => toast.error(e.message ?? "Delete failed"),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <Label className="text-xs">Metric</Label>
          <Input className="rounded-none w-[180px]" value={filter.metric} onChange={(e) => setFilter({ ...filter, metric: e.target.value })} placeholder="e.g. acwr" />
        </div>
        <div>
          <Label className="text-xs">Position</Label>
          <Input className="rounded-none w-[160px]" value={filter.position} onChange={(e) => setFilter({ ...filter, position: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Age group</Label>
          <Input className="rounded-none w-[140px]" value={filter.age} onChange={(e) => setFilter({ ...filter, age: e.target.value })} />
        </div>
        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogTrigger asChild>
            <Button className="rounded-none ml-auto" onClick={() => setEditing({ ...emptyBand })}>
              <Plus className="h-4 w-4 mr-1" /> Add Band
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editing?.id ? "Edit band" : "New band"}</DialogTitle>
            </DialogHeader>
            {editing && <BandForm band={editing} onChange={setEditing} />}
            <DialogFooter>
              <Button variant="outline" className="rounded-none" onClick={() => setEditing(null)}>Cancel</Button>
              <Button className="rounded-none" onClick={() => editing && save.mutate(editing)}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Metric</TableHead>
            <TableHead>Scope</TableHead>
            <TableHead>Green</TableHead>
            <TableHead>Yellow</TableHead>
            <TableHead>Red</TableHead>
            <TableHead>Source</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((b) => (
            <TableRow key={b.id}>
              <TableCell className="font-mono text-sm">{b.metric_key}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {[b.position_or_group, b.sport, b.age_group, b.coach_id ? "coach" : "global"].filter(Boolean).join(" · ")}
              </TableCell>
              <TableCell>{b.green_min}–{b.green_max}</TableCell>
              <TableCell>{b.yellow_min}–{b.yellow_max}</TableCell>
              <TableCell>{b.red_min}–{b.red_max}</TableCell>
              <TableCell>
                {b.source ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger><Info className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent className="rounded-none max-w-xs">{b.source}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : "—"}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="rounded-none" onClick={() => setEditing(b)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="rounded-none" onClick={() => del.mutate(b.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const BandForm: React.FC<{ band: Partial<BandRow>; onChange: (b: Partial<BandRow>) => void }> = ({ band, onChange }) => {
  const set = (k: keyof BandRow, v: any) => onChange({ ...band, [k]: v === "" ? null : v });
  const numField = (label: string, key: keyof BandRow) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input type="number" step="any" className="rounded-none" value={(band[key] as any) ?? ""} onChange={(e) => set(key, e.target.value === "" ? null : Number(e.target.value))} />
    </div>
  );
  const txtField = (label: string, key: keyof BandRow) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input className="rounded-none" value={(band[key] as any) ?? ""} onChange={(e) => set(key, e.target.value)} />
    </div>
  );
  return (
    <div className="grid grid-cols-3 gap-3">
      {txtField("Metric key", "metric_key")}
      {txtField("Position/group", "position_or_group")}
      {txtField("Sport", "sport")}
      {txtField("Age group", "age_group")}
      <div className="col-span-2" />
      {numField("Green min", "green_min")}{numField("Green max", "green_max")}<div />
      {numField("Yellow min", "yellow_min")}{numField("Yellow max", "yellow_max")}<div />
      {numField("Red min", "red_min")}{numField("Red max", "red_max")}<div />
      <div className="col-span-3">{txtField("Source / citation", "source")}</div>
      <div className="col-span-3">{txtField("Notes", "notes")}</div>
    </div>
  );
};

const AmsSettingsPage: React.FC = () => {
  const { isAdmin, isCoach } = useRoleCheck();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const allowed = isAdmin() || isCoach();
  if (!allowed) {
    return <div className="p-6">Access denied.</div>;
  }

  const SidebarComp = isAdmin() ? Sidebar : CoachSidebar;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <div className="hidden lg:block">
          <SidebarComp isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        </div>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} />
            <div className="relative w-64 h-full">
              <SidebarComp isCollapsed={false} setIsCollapsed={() => {}} />
            </div>
          </div>
        )}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="sticky top-0 z-40 bg-background border-b border-border p-3 lg:hidden">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setIsMobileOpen(true)} className="rounded-none">
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">AMS Settings</h1>
            </div>
          </div>
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <h1 className="text-2xl font-bold mb-1 hidden lg:block">AMS Settings — Performance Bands</h1>
            <p className="text-sm text-muted-foreground mb-6">Manage feature flags and evidence-based performance band thresholds.</p>
            <Tabs defaultValue={isAdmin() ? "flags" : "bands"}>
              <TabsList className="rounded-none">
                {isAdmin() && <TabsTrigger value="flags" className="rounded-none">Feature Flags</TabsTrigger>}
                <TabsTrigger value="bands" className="rounded-none">Performance Bands</TabsTrigger>
              </TabsList>
              {isAdmin() && (
                <TabsContent value="flags" className="mt-4"><FlagsTab /></TabsContent>
              )}
              <TabsContent value="bands" className="mt-4"><BandsTab /></TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AmsSettingsPage;
