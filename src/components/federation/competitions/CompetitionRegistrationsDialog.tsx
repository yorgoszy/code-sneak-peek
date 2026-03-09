import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { matchesSearchTerm } from "@/lib/utils";

interface Registration {
  id: string;
  competition_id: string;
  category_id: string;
  club_id: string;
  athlete_id: string;
  weigh_in_weight: number | null;
  weigh_in_status: string;
  registration_status: string;
  notes: string | null;
  category?: { name: string } | null;
  club?: { name: string; avatar_url: string | null } | null;
  athlete?: { name: string; avatar_url: string | null; photo_url: string | null } | null;
}

interface Category {
  id: string;
  name: string;
}

interface CompetitionRegistrationsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  competitionId: string;
  competitionName: string;
}

export const CompetitionRegistrationsDialog: React.FC<CompetitionRegistrationsDialogProps> = ({
  isOpen, onClose, competitionId, competitionName,
}) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      fetchRegistrations();
      fetchCategories();
      setOpenGroups(new Set());
    }
  }, [isOpen, competitionId]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('federation_competition_categories')
      .select('id, name')
      .eq('competition_id', competitionId)
      .order('sort_order', { ascending: true });
    setCategories((data as Category[]) || []);
  };

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('federation_competition_registrations')
        .select(`
          *,
          category:federation_competition_categories(name),
          club:app_users!federation_competition_registrations_club_id_fkey(name, avatar_url),
          athlete:app_users!federation_competition_registrations_athlete_id_fkey(name, avatar_url, photo_url)
        `)
        .eq('competition_id', competitionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrations((data as unknown as Registration[]) || []);
    } catch (error) {
      console.error(error);
      toast.error('Σφάλμα φόρτωσης δηλώσεων');
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const getAgeGroupKey = (name: string): string => {
    if (name.startsWith('Ενήλικοι')) return 'Ενήλικοι';
    if (name.startsWith('U23')) return 'U23';
    const match = name.match(/^Νέ(?:οι|ες)\s*(\d+-\d+)/);
    if (match) return match[1];
    return 'Άλλα';
  };

  const getAgeGroupLabel = (key: string): string => {
    if (key === 'Ενήλικοι') return '18-40';
    if (key === 'U23') return 'U23';
    return key;
  };

  const isMale = (name: string) => /Άνδρ|Ανδρ|Αντρ|Άντρ/i.test(name);
  const isFemale = (name: string) => /Γυναίκ|Γυναικ/i.test(name);

  const getWeight = (name: string): string => {
    const m = name.match(/([-+±]\s*\d+[\d.,]*\s*kg)/i);
    return m ? m[1] : name;
  };

  const AGE_ORDER = ['Ενήλικοι', 'U23', '16-17', '14-15', '12-13', '10-11', '8-9', '5-7', 'Άλλα'];

  const ageGroups = new Map<string, Category[]>();
  categories.forEach(cat => {
    const key = getAgeGroupKey(cat.name);
    if (!ageGroups.has(key)) ageGroups.set(key, []);
    ageGroups.get(key)!.push(cat);
  });

  const sortedAgeKeys = AGE_ORDER.filter(k => ageGroups.has(k));

  const filtered = registrations.filter(r => {
    if (!searchTerm) return true;
    return matchesSearchTerm(r.athlete?.name || '', searchTerm) ||
      matchesSearchTerm(r.club?.name || '', searchTerm) ||
      matchesSearchTerm(r.category?.name || '', searchTerm);
  });

  const renderColumn = (columnCats: Category[], gender: string) => (
    <div className="flex-1 min-w-0">
      <div className="text-[10px] font-semibold text-muted-foreground px-2 py-1 border-b border-border/50">
        {gender}
      </div>
      {columnCats.map(cat => {
        const catRegs = filtered.filter(r => r.category_id === cat.id);
        return (
          <div key={cat.id} className="border-b border-border/30">
            <div className="flex items-center gap-1.5 px-2 py-1 text-xs">
              <span className="font-medium">{getWeight(cat.name)}</span>
              <div className="flex items-center gap-0.5 flex-1 justify-end">
                {catRegs.map(reg => {
                  const athleteName = reg.athlete?.name || 'Ά';
                  const athleteAvatar = reg.athlete?.photo_url || reg.athlete?.avatar_url || '';
                  return (
                    <Avatar key={reg.id} className="h-5 w-5 rounded-full">
                      <AvatarImage src={athleteAvatar} />
                      <AvatarFallback className="text-[8px] rounded-full">{athleteName.charAt(0)}</AvatarFallback>
                    </Avatar>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle>Δηλώσεις - {competitionName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Αναζήτηση αθλητή, σωματείου..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 rounded-none"
            />
          </div>

          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Φόρτωση...</p>
          ) : categories.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Δεν υπάρχουν κατηγορίες</p>
          ) : (
            <div className="space-y-0">
              {sortedAgeKeys.map(ageKey => {
                const cats = ageGroups.get(ageKey)!;
                const maleCats = cats.filter(c => isMale(c.name));
                const femaleCats = cats.filter(c => isFemale(c.name));
                const groupRegs = filtered.filter(r => cats.some(c => c.id === r.category_id));
                const isOpen = openGroups.has(ageKey);

                return (
                  <div key={ageKey}>
                    <button
                      type="button"
                      onClick={() => toggleGroup(ageKey)}
                      className="flex items-center justify-between w-full text-xs font-bold text-foreground bg-muted px-3 py-2 border-b border-border hover:bg-muted/80 cursor-pointer"
                    >
                      <span>{getAgeGroupLabel(ageKey)} ({cats.length})</span>
                      <div className="flex items-center gap-2">
                        {groupRegs.length > 0 && (
                          <Badge className="rounded-none text-[10px] bg-foreground text-background h-5">
                            {groupRegs.length} αθλ.
                          </Badge>
                        )}
                        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="flex gap-0 divide-x divide-border">
                        {maleCats.length > 0 && renderColumn(maleCats, 'Άνδρες')}
                        {femaleCats.length > 0 && renderColumn(femaleCats, 'Γυναίκες')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-xs text-muted-foreground text-right">
            Σύνολο: {filtered.length} δηλώσεις
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
