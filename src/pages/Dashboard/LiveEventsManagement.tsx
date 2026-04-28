import React, { useEffect, useState } from "react";
import { Menu, Plus, Trash2, Pencil, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/Sidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { parseYouTubeId } from "@/utils/youtubeIframeApi";

const normalizeEmbedUrl = (url: string): string => {
  if (!url) return url;
  if (url.includes("/embed/")) return url;
  const ytId = parseYouTubeId(url);
  if (ytId) return `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&playsinline=1`;
  const twitchMatch = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
  if (twitchMatch) {
    const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
    return `https://player.twitch.tv/?channel=${twitchMatch[1]}&parent=${host}&autoplay=true&muted=true`;
  }
  return url;
};

const formatDateGR = (iso: string): string => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
};

interface LiveEvent {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
}

interface LiveRing {
  id: string;
  event_id: string;
  ring_name: string;
  embed_url: string;
  display_order: number;
  embed_url_day1: string | null;
  embed_url_day2: string | null;
  day1_date: string | null;
  day2_date: string | null;
  day1_start_seconds: number | null;
  day1_end_seconds: number | null;
  day2_start_seconds: number | null;
  day2_end_seconds: number | null;
}

// Parse "HH:MM:SS", "MM:SS", or plain seconds into total seconds
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

const todayStr = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const pickActiveEmbed = (r: LiveRing): string => {
  const today = todayStr();
  if (r.day1_date && r.embed_url_day1 && r.day1_date === today) return r.embed_url_day1;
  if (r.day2_date && r.embed_url_day2 && r.day2_date === today) return r.embed_url_day2;
  // Fallback: first available
  return r.embed_url_day1 || r.embed_url_day2 || r.embed_url || "";
};

const LiveEventsManagement: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [rings, setRings] = useState<Record<string, LiveRing[]>>({});
  const [loading, setLoading] = useState(true);

  const [eventDialog, setEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<LiveEvent | null>(null);
  const [eventForm, setEventForm] = useState({ title: "", description: "", is_active: true });

  const [ringDialog, setRingDialog] = useState(false);
  const [activeEventForRing, setActiveEventForRing] = useState<string | null>(null);
  const [editingRing, setEditingRing] = useState<LiveRing | null>(null);
  const [ringForm, setRingForm] = useState({
    ring_name: "",
    embed_url: "",
    display_order: 0,
    embed_url_day1: "",
    embed_url_day2: "",
    day1_date: "",
    day2_date: "",
    day1_start: "",
    day1_end: "",
    day2_start: "",
    day2_end: "",
  });

  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [deleteRingId, setDeleteRingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data: ev } = await supabase.from("live_events").select("*").order("created_at", { ascending: false });
    const { data: rg } = await supabase.from("live_event_rings").select("*").order("display_order");
    setEvents(ev || []);
    const grouped: Record<string, LiveRing[]> = {};
    (rg || []).forEach((r) => {
      if (!grouped[r.event_id]) grouped[r.event_id] = [];
      grouped[r.event_id].push(r);
    });
    setRings(grouped);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreateEvent = () => {
    setEditingEvent(null);
    setEventForm({ title: "", description: "", is_active: true });
    setEventDialog(true);
  };

  const openEditEvent = (e: LiveEvent) => {
    setEditingEvent(e);
    setEventForm({ title: e.title, description: e.description || "", is_active: e.is_active });
    setEventDialog(true);
  };

  const saveEvent = async () => {
    if (!eventForm.title.trim()) {
      toast.error("Συμπληρώστε τίτλο");
      return;
    }
    if (editingEvent) {
      const { error } = await supabase.from("live_events").update(eventForm).eq("id", editingEvent.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Ενημερώθηκε");
    } else {
      const { error } = await supabase.from("live_events").insert(eventForm);
      if (error) { toast.error(error.message); return; }
      toast.success("Δημιουργήθηκε");
    }
    setEventDialog(false);
    fetchData();
  };

  const deleteEvent = async () => {
    if (!deleteEventId) return;
    const { error } = await supabase.from("live_events").delete().eq("id", deleteEventId);
    if (error) { toast.error(error.message); return; }
    toast.success("Διαγράφηκε");
    setDeleteEventId(null);
    fetchData();
  };

  const openCreateRing = (eventId: string) => {
    setActiveEventForRing(eventId);
    setEditingRing(null);
    setRingForm({
      ring_name: "",
      embed_url: "",
      display_order: rings[eventId]?.length || 0,
      embed_url_day1: "",
      embed_url_day2: "",
      day1_date: "",
      day2_date: "",
      day1_start: "",
      day1_end: "",
      day2_start: "",
      day2_end: "",
    });
    setRingDialog(true);
  };

  const openEditRing = (r: LiveRing) => {
    setActiveEventForRing(r.event_id);
    setEditingRing(r);
    setRingForm({
      ring_name: r.ring_name,
      embed_url: r.embed_url,
      display_order: r.display_order,
      embed_url_day1: r.embed_url_day1 || "",
      embed_url_day2: r.embed_url_day2 || "",
      day1_date: r.day1_date || "",
      day2_date: r.day2_date || "",
    });
    setRingDialog(true);
  };

  const saveRing = async () => {
    if (!ringForm.ring_name.trim() || !activeEventForRing) {
      toast.error("Συμπληρώστε όνομα ρινγκ");
      return;
    }
    if (!ringForm.embed_url_day1.trim() && !ringForm.embed_url_day2.trim() && !ringForm.embed_url.trim()) {
      toast.error("Συμπληρώστε τουλάχιστον ένα link");
      return;
    }
    const payload = {
      ring_name: ringForm.ring_name,
      embed_url: ringForm.embed_url || ringForm.embed_url_day1 || ringForm.embed_url_day2,
      display_order: ringForm.display_order,
      embed_url_day1: ringForm.embed_url_day1 || null,
      embed_url_day2: ringForm.embed_url_day2 || null,
      day1_date: ringForm.day1_date || null,
      day2_date: ringForm.day2_date || null,
    };
    if (editingRing) {
      const { error } = await supabase.from("live_event_rings").update(payload).eq("id", editingRing.id);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from("live_event_rings").insert({ ...payload, event_id: activeEventForRing });
      if (error) { toast.error(error.message); return; }
    }
    toast.success("Αποθηκεύτηκε");
    setRingDialog(false);
    fetchData();
  };

  const deleteRing = async () => {
    if (!deleteRingId) return;
    const { error } = await supabase.from("live_event_rings").delete().eq("id", deleteRingId);
    if (error) { toast.error(error.message); return; }
    toast.success("Διαγράφηκε");
    setDeleteRingId(null);
    fetchData();
  };

  const renderSidebar = () => <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;

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
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setIsMobileOpen(true)} className="rounded-none">
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">Live Αγώνες</h1>
            </div>
          </div>

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Radio className="h-6 w-6" /> Live Αγώνες
                </h1>
                <p className="text-sm text-muted-foreground">Διαχείριση live streams ανά ρινγκ</p>
              </div>
              <Button onClick={openCreateEvent} className="rounded-none">
                <Plus className="h-4 w-4 mr-2" /> Νέο Event
              </Button>
            </div>

            <div className="lg:hidden mb-4">
              <Button onClick={openCreateEvent} className="rounded-none w-full">
                <Plus className="h-4 w-4 mr-2" /> Νέο Event
              </Button>
            </div>

            {loading ? (
              <p className="text-muted-foreground">Φόρτωση...</p>
            ) : events.length === 0 ? (
              <Card className="rounded-none">
                <CardContent className="p-8 text-center text-muted-foreground">
                  Δεν υπάρχουν events. Δημιουργήστε το πρώτο σας.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <Card key={event.id} className="rounded-none">
                    <CardHeader className="flex flex-row items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="flex items-center gap-2 flex-wrap">
                          {event.title}
                          {event.is_active ? (
                            <Badge className="rounded-none bg-[#00ffba] text-black hover:bg-[#00ffba]/90">Ενεργό</Badge>
                          ) : (
                            <Badge variant="outline" className="rounded-none">Ανενεργό</Badge>
                          )}
                        </CardTitle>
                        {event.description && <p className="text-sm text-muted-foreground mt-1">{event.description}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="rounded-none" onClick={() => openEditEvent(event)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-none" onClick={() => setDeleteEventId(event.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-sm">Ρινγκ ({rings[event.id]?.length || 0})</h3>
                        <Button size="sm" variant="outline" className="rounded-none" onClick={() => openCreateRing(event.id)}>
                          <Plus className="h-4 w-4 mr-1" /> Προσθήκη Ρινγκ
                        </Button>
                      </div>
                      {(rings[event.id] || []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">Δεν υπάρχουν ρινγκ.</p>
                      ) : (
                        <div className={`grid gap-4 ${rings[event.id].length === 1 ? 'grid-cols-1' : rings[event.id].length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
                          {rings[event.id].map((r) => (
                            <div key={r.id} className="border border-border bg-card">
                              <div className="px-3 py-2 bg-[#00ffba] text-black font-bold flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                  <Radio className="w-4 h-4" />
                                  Ρινγκ {r.ring_name}
                                </span>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="sm" className="rounded-none h-7 w-7 p-0 text-black hover:bg-black/10" onClick={() => openEditRing(r)}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="rounded-none h-7 w-7 p-0 text-black hover:bg-black/10" onClick={() => setDeleteRingId(r.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                              <div className="relative w-full bg-black" style={{ paddingBottom: "56.25%" }}>
                                {pickActiveEmbed(r) ? (
                                  <iframe
                                    src={normalizeEmbedUrl(pickActiveEmbed(r))}
                                    className="absolute inset-0 w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title={`Ρινγκ ${r.ring_name}`}
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">Χωρίς link</div>
                                )}
                              </div>
                              <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border space-y-1">
                                {r.day1_date && (
                                  <div className="truncate"><span className="font-semibold">Ημέρα 1 ({formatDateGR(r.day1_date)}):</span> {r.embed_url_day1 || "—"}</div>
                                )}
                                {r.day2_date && (
                                  <div className="truncate"><span className="font-semibold">Ημέρα 2 ({formatDateGR(r.day2_date)}):</span> {r.embed_url_day2 || "—"}</div>
                                )}
                                {!r.day1_date && !r.day2_date && (
                                  <div className="truncate">{r.embed_url}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>

        {/* Event Dialog */}
        <Dialog open={eventDialog} onOpenChange={setEventDialog}>
          <DialogContent className="rounded-none">
            <DialogHeader>
              <DialogTitle>{editingEvent ? "Επεξεργασία Event" : "Νέο Event"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Τίτλος</Label>
                <Input className="rounded-none" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} placeholder="π.χ. Πανελλήνιο Πρωτάθλημα 2026" />
              </div>
              <div>
                <Label>Περιγραφή (προαιρετικό)</Label>
                <Textarea className="rounded-none" value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Ενεργό (εμφάνιση στο landing)</Label>
                <Switch checked={eventForm.is_active} onCheckedChange={(v) => setEventForm({ ...eventForm, is_active: v })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="rounded-none" onClick={() => setEventDialog(false)}>Ακύρωση</Button>
              <Button className="rounded-none" onClick={saveEvent}>Αποθήκευση</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Ring Dialog */}
        <Dialog open={ringDialog} onOpenChange={setRingDialog}>
          <DialogContent className="rounded-none">
            <DialogHeader>
              <DialogTitle>{editingRing ? "Επεξεργασία Ρινγκ" : "Νέο Ρινγκ"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Label className="text-xs">Όνομα Ρινγκ</Label>
                  <Input className="rounded-none h-8" value={ringForm.ring_name} onChange={(e) => setRingForm({ ...ringForm, ring_name: e.target.value })} placeholder="π.χ. Α, Β, 1" />
                </div>
                <div>
                  <Label className="text-xs">Σειρά</Label>
                  <Input type="number" className="rounded-none h-8" value={ringForm.display_order} onChange={(e) => setRingForm({ ...ringForm, display_order: parseInt(e.target.value) || 0 })} />
                </div>
              </div>

              <div className="border border-border p-2 space-y-2">
                <Label className="font-semibold text-xs">Ημέρα 1</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input type="date" className="rounded-none h-8 col-span-1" value={ringForm.day1_date} onChange={(e) => setRingForm({ ...ringForm, day1_date: e.target.value })} />
                  <Input className="rounded-none h-8 col-span-2" value={ringForm.embed_url_day1} onChange={(e) => setRingForm({ ...ringForm, embed_url_day1: e.target.value })} placeholder="Embed URL" />
                </div>
              </div>

              <div className="border border-border p-2 space-y-2">
                <Label className="font-semibold text-xs">Ημέρα 2</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input type="date" className="rounded-none h-8 col-span-1" value={ringForm.day2_date} onChange={(e) => setRingForm({ ...ringForm, day2_date: e.target.value })} />
                  <Input className="rounded-none h-8 col-span-2" value={ringForm.embed_url_day2} onChange={(e) => setRingForm({ ...ringForm, embed_url_day2: e.target.value })} placeholder="Embed URL" />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">Εμφανίζεται αυτόματα το link που ταιριάζει με τη σημερινή ημερομηνία.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" className="rounded-none" onClick={() => setRingDialog(false)}>Ακύρωση</Button>
              <Button className="rounded-none" onClick={saveRing}>Αποθήκευση</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirmations */}
        <AlertDialog open={!!deleteEventId} onOpenChange={(o) => !o && setDeleteEventId(null)}>
          <AlertDialogContent className="rounded-none">
            <AlertDialogHeader>
              <AlertDialogTitle>Διαγραφή event;</AlertDialogTitle>
              <AlertDialogDescription>Θα διαγραφούν και όλα τα ρινγκ του.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
              <AlertDialogAction onClick={deleteEvent} className="bg-destructive hover:bg-destructive/90 rounded-none">Διαγραφή</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!deleteRingId} onOpenChange={(o) => !o && setDeleteRingId(null)}>
          <AlertDialogContent className="rounded-none">
            <AlertDialogHeader>
              <AlertDialogTitle>Διαγραφή ρινγκ;</AlertDialogTitle>
              <AlertDialogDescription>Δεν μπορεί να αναιρεθεί.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
              <AlertDialogAction onClick={deleteRing} className="bg-destructive hover:bg-destructive/90 rounded-none">Διαγραφή</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SidebarProvider>
  );
};

export default LiveEventsManagement;
