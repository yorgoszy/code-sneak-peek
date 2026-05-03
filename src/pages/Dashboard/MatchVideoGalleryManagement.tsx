import React, { useEffect, useState } from "react";
import { Menu, Plus, Trash2, Pencil, Video, Copy, Scissors, X } from "lucide-react";
import { VideoEditorTab } from "@/components/video-analysis/VideoEditorTab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/Sidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserSearchCombobox } from "@/components/users/UserSearchCombobox";

const parseTimeToSeconds = (input: string): number | null => {
  if (!input || !input.trim()) return null;
  const s = input.trim();
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  const parts = s.split(":").map((p) => parseInt(p, 10));
  if (parts.some((n) => isNaN(n))) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
};

const secondsToTime = (sec: number | null | undefined): string => {
  if (sec == null) return "";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

interface MatchVideo {
  id: string;
  title: string;
  competition_name: string | null;
  match_date: string | null;
  age_category: string | null;
  weight_category: string | null;
  youtube_url: string;
  start_seconds: number | null;
  end_seconds: number | null;
  red_athlete_id: string | null;
  blue_athlete_id: string | null;
  red_athlete_name: string | null;
  blue_athlete_name: string | null;
}

const emptyForm = {
  id: "",
  title: "",
  competition_name: "",
  match_date: "",
  age_category: "",
  weight_category: "",
  youtube_url: "",
  start_str: "",
  end_str: "",
  red_athlete_id: null as string | null,
  blue_athlete_id: null as string | null,
  red_athlete_name: "",
  blue_athlete_name: "",
};

const MatchVideoGalleryManagement: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [videos, setVideos] = useState<MatchVideo[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [athleteNames, setAthleteNames] = useState<Record<string, string>>({});
  const [analyzeVideo, setAnalyzeVideo] = useState<MatchVideo | null>(null);

  const renderSidebar = () => <Sidebar isCollapsed={false} setIsCollapsed={() => {}} />;

  const load = async () => {
    const { data, error } = await supabase
      .from("match_videos" as any)
      .select("*")
      .order("match_date", { ascending: false, nullsFirst: false });
    if (error) { toast.error(error.message); return; }
    const list = (data || []) as unknown as MatchVideo[];
    setVideos(list);

    const ids = Array.from(new Set(list.flatMap(v => [v.red_athlete_id, v.blue_athlete_id]).filter(Boolean))) as string[];
    if (ids.length) {
      const { data: users } = await supabase.from("app_users").select("id,name").in("id", ids);
      const map: Record<string, string> = {};
      (users || []).forEach((u: any) => { map[u.id] = u.name; });
      setAthleteNames(map);
    }
  };

  useEffect(() => { load(); }, []);

  // Auto-detect ηλικιακή κατηγορία based on red athlete's birth_date + gender
  const autoDetectAgeCategory = async (athleteId: string) => {
    if (!athleteId) return;
    const { data: u } = await supabase
      .from("app_users")
      .select("birth_date, gender")
      .eq("id", athleteId)
      .maybeSingle();
    if (!u?.birth_date) return;
    const dob = new Date(u.birth_date as string);
    if (isNaN(dob.getTime())) return;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;

    const genderRaw = (u.gender || "").toString().toLowerCase();
    const gender = genderRaw.startsWith("f") || genderRaw.includes("γυν") || genderRaw.includes("θηλ")
      ? "female"
      : (genderRaw.startsWith("m") || genderRaw.includes("αν") || genderRaw.includes("αρ")) ? "male" : null;

    let q = supabase
      .from("federation_category_templates")
      .select("name, min_age, max_age, gender")
      .lte("min_age", age);
    const { data: cats } = await q;
    if (!cats || cats.length === 0) return;

    const matches = cats.filter((c: any) => {
      const okMin = c.min_age == null || age >= c.min_age;
      const okMax = c.max_age == null || age <= c.max_age;
      const okGender = !c.gender || c.gender === "all" || !gender || c.gender === gender;
      return okMin && okMax && okGender;
    });
    if (matches.length === 0) return;

    // Prefer the most specific (smallest age range) and gender-matching
    matches.sort((a: any, b: any) => {
      const aGen = a.gender === gender ? 0 : 1;
      const bGen = b.gender === gender ? 0 : 1;
      if (aGen !== bGen) return aGen - bGen;
      const aRange = (a.max_age ?? 99) - (a.min_age ?? 0);
      const bRange = (b.max_age ?? 99) - (b.min_age ?? 0);
      return aRange - bRange;
    });
    // Extract just the age portion (strip weight like " -45kg")
    const cleanName = (matches[0].name || "").replace(/\s*[-+]?\s*\d+\s*kg.*/i, "").trim();
    setForm((f) => ({ ...f, age_category: cleanName || f.age_category }));
  };

  const openNew = () => { setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (v: MatchVideo) => {
    setForm({
      id: v.id,
      title: v.title || "",
      competition_name: v.competition_name || "",
      match_date: v.match_date || "",
      age_category: v.age_category || "",
      weight_category: v.weight_category || "",
      youtube_url: v.youtube_url || "",
      start_str: secondsToTime(v.start_seconds),
      end_str: secondsToTime(v.end_seconds),
      red_athlete_id: v.red_athlete_id,
      blue_athlete_id: v.blue_athlete_id,
      red_athlete_name: v.red_athlete_name || "",
      blue_athlete_name: v.blue_athlete_name || "",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.youtube_url.trim()) {
      toast.error("Τίτλος και YouTube URL είναι απαραίτητα");
      return;
    }
    const payload: any = {
      title: form.title.trim(),
      competition_name: form.competition_name.trim() || null,
      match_date: form.match_date || null,
      age_category: form.age_category.trim() || null,
      weight_category: form.weight_category.trim() || null,
      youtube_url: form.youtube_url.trim(),
      start_seconds: parseTimeToSeconds(form.start_str),
      end_seconds: parseTimeToSeconds(form.end_str),
      red_athlete_id: form.red_athlete_id,
      blue_athlete_id: form.blue_athlete_id,
      red_athlete_name: form.red_athlete_name.trim() || null,
      blue_athlete_name: form.blue_athlete_name.trim() || null,
    };
    if (form.id) {
      const { error } = await supabase.from("match_videos" as any).update(payload).eq("id", form.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Ενημερώθηκε");
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      payload.created_by = user?.id;
      const { error } = await supabase.from("match_videos" as any).insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Δημιουργήθηκε");
    }
    setDialogOpen(false);
    load();
  };

  const doDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("match_videos" as any).delete().eq("id", deleteId);
    if (error) { toast.error(error.message); return; }
    toast.success("Διαγράφηκε");
    setDeleteId(null);
    load();
  };

  const duplicate = async (v: MatchVideo) => {
    const { data: { user } } = await supabase.auth.getUser();
    const payload: any = {
      title: `${v.title} (αντίγραφο)`,
      competition_name: v.competition_name,
      match_date: v.match_date,
      age_category: v.age_category,
      weight_category: v.weight_category,
      youtube_url: v.youtube_url,
      start_seconds: v.start_seconds,
      end_seconds: v.end_seconds,
      red_athlete_id: v.red_athlete_id,
      blue_athlete_id: v.blue_athlete_id,
      created_by: user?.id,
    };
    const { error } = await supabase.from("match_videos" as any).insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Αντιγράφηκε");
    load();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <div className="hidden lg:block">{renderSidebar()}</div>

        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} />
            <div className="relative w-64 h-full">{renderSidebar()}</div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <div className="sticky top-0 z-40 bg-background border-b border-border p-3 lg:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setIsMobileOpen(true)} className="rounded-none">
                  <Menu className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-semibold">Video Gallery</h1>
              </div>
            </div>
          </div>

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Video className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Video Gallery Αγώνων</h1>
              </div>
              <Button onClick={openNew} className="rounded-none">
                <Plus className="h-4 w-4 mr-2" /> Νέο Βίντεο
              </Button>
            </div>
            <div className="lg:hidden mb-4">
              <Button onClick={openNew} className="rounded-none w-full">
                <Plus className="h-4 w-4 mr-2" /> Νέο Βίντεο
              </Button>
            </div>

            <div className="grid gap-1.5">
              {videos.length === 0 && (
                <Card className="rounded-none"><CardContent className="p-4 text-center text-muted-foreground text-sm">Δεν υπάρχουν βίντεο.</CardContent></Card>
              )}
              {videos.map((v) => (
                <Card key={v.id} className="rounded-none">
                  <CardContent className="px-2 py-1.5 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1 flex items-center gap-2 text-xs">
                      <span className="font-semibold truncate max-w-[180px]">{v.title}</span>
                      <span className="text-muted-foreground truncate">
                        {[v.match_date, v.competition_name, v.age_category, v.weight_category].filter(Boolean).join(" · ")}
                      </span>
                      <span className="ml-auto whitespace-nowrap">
                        <span className="text-red-600 font-semibold">{v.red_athlete_id ? (athleteNames[v.red_athlete_id] || "—") : "—"}</span>
                        <span className="mx-1 text-muted-foreground">vs</span>
                        <span className="text-blue-600 font-semibold">{v.blue_athlete_id ? (athleteNames[v.blue_athlete_id] || "—") : "—"}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="icon" variant="ghost" onClick={() => setAnalyzeVideo(v)} className="rounded-none h-7 w-7" title="Ανάλυση Βίντεο">
                        <Scissors className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => duplicate(v)} className="rounded-none h-7 w-7" title="Αντιγραφή">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(v)} className="rounded-none h-7 w-7">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteId(v.id)} className="rounded-none h-7 w-7">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl rounded-none">
          <DialogHeader>
            <DialogTitle>{form.id ? "Επεξεργασία Βίντεο" : "Νέο Βίντεο"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Τίτλος αγώνα *</Label>
              <Input className="rounded-none" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Διοργάνωση</Label>
                <Input className="rounded-none" value={form.competition_name} onChange={(e) => setForm({ ...form, competition_name: e.target.value })} />
              </div>
              <div>
                <Label>Ημερομηνία</Label>
                <Input type="date" className="rounded-none" value={form.match_date} onChange={(e) => setForm({ ...form, match_date: e.target.value })} />
              </div>
              <div>
                <Label>Ηλικιακή κατηγορία</Label>
                <Input className="rounded-none" value={form.age_category} onChange={(e) => setForm({ ...form, age_category: e.target.value })} placeholder="π.χ. 12-14" />
              </div>
              <div>
                <Label>Κατηγορία βάρους</Label>
                <Input className="rounded-none" value={form.weight_category} onChange={(e) => setForm({ ...form, weight_category: e.target.value })} placeholder="π.χ. -45kg" />
              </div>
            </div>
            <div>
              <Label>YouTube URL *</Label>
              <Input className="rounded-none" value={form.youtube_url} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Από (ωω:λλ:δδ)</Label>
                <Input className="rounded-none" value={form.start_str} onChange={(e) => setForm({ ...form, start_str: e.target.value })} placeholder="6:27:37" />
              </div>
              <div>
                <Label>Έως (ωω:λλ:δδ)</Label>
                <Input className="rounded-none" value={form.end_str} onChange={(e) => setForm({ ...form, end_str: e.target.value })} placeholder="6:49:00" />
              </div>
            </div>
            <div>
              <Label className="text-red-600">Αθλητής Red corner</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <UserSearchCombobox
                    value={form.red_athlete_id || ""}
                    onValueChange={(v) => {
                      setForm({ ...form, red_athlete_id: v });
                      if (v) autoDetectAgeCategory(v);
                    }}
                    placeholder="Επιλέξτε αθλητή Red..."
                    filterByCoach={false}
                  />
                </div>
                {form.red_athlete_id && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-none shrink-0"
                    onClick={() => setForm({ ...form, red_athlete_id: null })}
                    title="Αφαίρεση αθλητή"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div>
              <Label className="text-blue-600">Αθλητής Blue corner</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <UserSearchCombobox
                    value={form.blue_athlete_id || ""}
                    onValueChange={(v) => setForm({ ...form, blue_athlete_id: v })}
                    placeholder="Επιλέξτε αθλητή Blue..."
                    filterByCoach={false}
                  />
                </div>
                {form.blue_athlete_id && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-none shrink-0"
                    onClick={() => setForm({ ...form, blue_athlete_id: null })}
                    title="Αφαίρεση αθλητή"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-none" onClick={() => setDialogOpen(false)}>Ακύρωση</Button>
            <Button className="rounded-none" onClick={save}>Αποθήκευση</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Διαγραφή βίντεο;</AlertDialogTitle>
            <AlertDialogDescription>Δεν μπορεί να αναιρεθεί.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-destructive hover:bg-destructive/90 rounded-none">Διαγραφή</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!analyzeVideo} onOpenChange={(o) => !o && setAnalyzeVideo(null)}>
        <DialogContent className="max-w-[96vw] w-[96vw] h-[94vh] max-h-[94vh] overflow-hidden rounded-none p-2 flex flex-col gap-2">
          <DialogHeader className="shrink-0 py-0">
            <DialogTitle className="text-sm leading-tight">
              Ανάλυση Βίντεο: {analyzeVideo?.title}
            </DialogTitle>
          </DialogHeader>
          {analyzeVideo && (
            <div className="flex-1 min-h-0 overflow-hidden compact-video-editor">
              <VideoEditorTab
                key={analyzeVideo.id}
                initialYoutubeUrl={analyzeVideo.youtube_url}
                initialUserId={analyzeVideo.red_athlete_id || undefined}
                initialOpponentName={
                  analyzeVideo.blue_athlete_id
                    ? (athleteNames[analyzeVideo.blue_athlete_id] || undefined)
                    : undefined
                }
                initialStartSeconds={analyzeVideo.start_seconds}
                initialEndSeconds={analyzeVideo.end_seconds}
                initialMatchTitle={analyzeVideo.title}
                compactMode
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default MatchVideoGalleryManagement;
