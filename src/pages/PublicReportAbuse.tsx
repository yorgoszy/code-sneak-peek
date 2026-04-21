import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { AlertTriangle, Loader2, Send, Check, ChevronsUpDown, Shield } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ABUSE_TYPES = [
  { id: 'physical', label: 'Σωματική' },
  { id: 'psychological', label: 'Ψυχολογική' },
  { id: 'sexual', label: 'Σεξουαλική' },
  { id: 'verbal', label: 'Λεκτική' },
  { id: 'bullying', label: 'Εκφοβισμός' },
  { id: 'other', label: 'Άλλο' },
];

const normalize = (s: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export default function PublicReportAbuse() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [sport, setSport] = useState("");
  const [sports, setSports] = useState<string[]>([]);

  const [clubs, setClubs] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [clubId, setClubId] = useState<string>("");
  const [clubNameText, setClubNameText] = useState("");
  const [clubAddress, setClubAddress] = useState("");
  const [clubCity, setClubCity] = useState("");
  const [clubCountry, setClubCountry] = useState("Ελλάδα");

  const [coachId, setCoachId] = useState<string>("");
  const [coachNameText, setCoachNameText] = useState("");

  const [clubOpen, setClubOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [clubSearch, setClubSearch] = useState("");
  const [coachSearch, setCoachSearch] = useState("");

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [incidentDate, setIncidentDate] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc('get_public_clubs_directory');
      const all = (data as any[]) || [];
      setClubs(all.filter((u) => ['admin', 'coach', 'trainer'].includes(u.role)));
      setCoaches(all.filter((u) => ['coach', 'trainer'].includes(u.role)));
      const uniqueSports = Array.from(
        new Set(all.filter((u) => u.role === 'federation').map((u: any) => (u.sport || '').trim()).filter(Boolean))
      ).sort();
      setSports(uniqueSports);
    })();
  }, []);

  const filteredClubs = useMemo(() => {
    const q = normalize(clubSearch);
    if (!q) return clubs.slice(0, 50);
    return clubs.filter((c) => normalize(c.name).includes(q)).slice(0, 50);
  }, [clubs, clubSearch]);

  const filteredCoaches = useMemo(() => {
    const q = normalize(coachSearch);
    const base = clubId ? coaches.filter((c) => c.id === clubId || c.coach_id === clubId) : coaches;
    if (!q) return base.slice(0, 50);
    return base.filter((c) => normalize(c.name).includes(q)).slice(0, 50);
  }, [coaches, coachSearch, clubId]);

  const toggleType = (id: string) =>
    setSelectedTypes((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const handleSubmit = async () => {
    if (!reporterName.trim() || !reporterEmail.trim()) {
      toast.error("Συμπληρώστε όνομα και email");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(reporterEmail)) {
      toast.error("Μη έγκυρο email");
      return;
    }
    if (!sport) {
      toast.error("Επιλέξτε άθλημα");
      return;
    }
    if (!clubId && !clubNameText.trim()) {
      toast.error("Επιλέξτε σύλλογο ή γράψτε όνομα");
      return;
    }
    if (selectedTypes.length === 0) {
      toast.error("Επιλέξτε τουλάχιστον έναν τύπο");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-public-abuse-report', {
        body: {
          reporter_name: reporterName,
          reporter_email: reporterEmail,
          reporter_phone: reporterPhone,
          sport,
          club_id: clubId || null,
          club_name_text: clubId ? null : clubNameText,
          club_address: clubAddress,
          club_city: clubCity,
          club_country: clubCountry,
          coach_id: coachId || null,
          coach_name_text: coachId ? null : coachNameText,
          abuse_types: selectedTypes,
          description,
          incident_date: incidentDate || null,
          is_anonymous: isAnonymous,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      navigate('/report-abuse/thank-you');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Σφάλμα κατά την υποβολή");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-3 px-2">
      <div className="max-w-2xl mx-auto space-y-2">
        <div className="text-center space-y-1">
          <Shield className="h-6 w-6 mx-auto text-foreground" />
          <h1 className="text-base font-bold">Καταγγελία Κακοποίησης στον Αθλητισμό</h1>
          <p className="text-[11px] text-muted-foreground">Όλα τα στοιχεία είναι εμπιστευτικά.</p>
        </div>

        <Card className="rounded-none border border-destructive/30">
          <CardHeader className="bg-destructive/5 py-1.5 px-3">
            <CardTitle className="flex items-center gap-1.5 text-destructive text-xs">
              <AlertTriangle className="h-3.5 w-3.5" /> Φόρμα Καταγγελίας
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-2 px-3 pb-3">
            <div className="space-y-1.5">
              <h3 className="font-semibold text-[11px] uppercase tracking-wide text-muted-foreground border-b pb-0.5">Καταγγέλλων</h3>
              <div className="grid md:grid-cols-3 gap-1.5">
                <Input value={reporterName} onChange={(e) => setReporterName(e.target.value)} className="rounded-none h-8 text-xs" placeholder="Ονοματεπώνυμο *" />
                <Input type="email" value={reporterEmail} onChange={(e) => setReporterEmail(e.target.value)} className="rounded-none h-8 text-xs" placeholder="Email *" />
                <Input type="tel" value={reporterPhone} onChange={(e) => setReporterPhone(e.target.value)} className="rounded-none h-8 text-xs" placeholder="Τηλέφωνο" />
              </div>
              <div
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={cn(
                  "flex items-center gap-2 px-2 py-1 border cursor-pointer transition-colors",
                  isAnonymous ? "border-foreground bg-muted" : "border-border hover:bg-muted/50"
                )}
              >
                <Checkbox checked={isAnonymous} />
                <span className="text-xs font-medium">Ανώνυμη υποβολή</span>
                <span className="text-[10px] text-muted-foreground hidden md:inline">— δεν κοινοποιούνται στοιχεία στην ομοσπονδία</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-semibold text-[11px] uppercase tracking-wide text-muted-foreground border-b pb-0.5">Σύλλογος</h3>
              <div className="grid md:grid-cols-2 gap-1.5">
                <Select value={sport} onValueChange={setSport}>
                  <SelectTrigger className="rounded-none h-8 text-xs"><SelectValue placeholder="Άθλημα *" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {sports.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    <SelectItem value="Άλλο">Άλλο</SelectItem>
                  </SelectContent>
                </Select>

                <Popover open={clubOpen} onOpenChange={setClubOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between rounded-none h-8 font-normal text-xs">
                      <span className="truncate">{clubId ? clubs.find((c) => c.id === clubId)?.name : (clubNameText || "Σύλλογος *")}</span>
                      <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-none" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput placeholder="Πληκτρολογήστε..." value={clubSearch} onValueChange={setClubSearch} />
                      <CommandList>
                        <CommandEmpty>
                          <div className="p-2 text-xs text-muted-foreground">Δεν βρέθηκε. Γράψτε ελεύθερα παρακάτω.</div>
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredClubs.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={c.id}
                              onSelect={() => {
                                setClubId(c.id);
                                setClubNameText("");
                                setClubOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", clubId === c.id ? "opacity-100" : "opacity-0")} />
                              {c.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {!clubId && (
                <Input
                  placeholder="Αν δεν υπάρχει στη λίστα, γράψτε όνομα συλλόγου..."
                  value={clubNameText}
                  onChange={(e) => setClubNameText(e.target.value)}
                  className="rounded-none h-8 text-xs"
                />
              )}

              <div className="grid md:grid-cols-3 gap-1.5">
                <Input value={clubAddress} onChange={(e) => setClubAddress(e.target.value)} className="rounded-none h-8 text-xs" placeholder="Διεύθυνση" />
                <Input value={clubCity} onChange={(e) => setClubCity(e.target.value)} className="rounded-none h-8 text-xs" placeholder="Πόλη" />
                <Input value={clubCountry} onChange={(e) => setClubCountry(e.target.value)} className="rounded-none h-8 text-xs" placeholder="Χώρα" />
              </div>

              <Popover open={coachOpen} onOpenChange={setCoachOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between rounded-none h-8 font-normal text-xs">
                    <span className="truncate">{coachId ? coaches.find((c) => c.id === coachId)?.name : (coachNameText || "Προπονητής")}</span>
                    <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-none" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput placeholder="Πληκτρολογήστε..." value={coachSearch} onValueChange={setCoachSearch} />
                    <CommandList>
                      <CommandEmpty>
                        <div className="p-2 text-xs text-muted-foreground">Δεν βρέθηκε. Γράψτε ελεύθερα παρακάτω.</div>
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredCoaches.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.id}
                            onSelect={() => {
                              setCoachId(c.id);
                              setCoachNameText("");
                              setCoachOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", coachId === c.id ? "opacity-100" : "opacity-0")} />
                            {c.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {!coachId && (
                <Input
                  placeholder="Ή γράψτε ονοματεπώνυμο προπονητή..."
                  value={coachNameText}
                  onChange={(e) => setCoachNameText(e.target.value)}
                  className="rounded-none h-8 text-xs"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <h3 className="font-semibold text-[11px] uppercase tracking-wide text-muted-foreground border-b pb-0.5">Περιστατικό</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-1">
                {ABUSE_TYPES.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => toggleType(t.id)}
                    className={cn(
                      "flex items-center gap-1 px-1.5 py-1 border cursor-pointer transition-colors",
                      selectedTypes.includes(t.id) ? "border-destructive bg-destructive/10" : "border-border hover:bg-muted/50"
                    )}
                  >
                    <Checkbox checked={selectedTypes.includes(t.id)} className="h-3 w-3" />
                    <span className="text-[11px]">{t.label}</span>
                  </div>
                ))}
              </div>
              <Input type="date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} className="rounded-none h-8 text-xs max-w-[180px]" />
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="rounded-none text-xs"
                placeholder="Περιγράψτε τι συνέβη..."
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-none h-9 text-sm"
            >
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Υποβολή Καταγγελίας
            </Button>

            <p className="text-[10px] text-center text-muted-foreground">
              Τα στοιχεία προωθούνται στις αρμόδιες ομοσπονδίες για διερεύνηση.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
