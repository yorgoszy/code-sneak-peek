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
  gender: string;
}

interface CompetitionRegistrationsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  competitionId: string;
  competitionName: string;
}

const AGE_ORDER = ['18-40', 'U23', '16-17', '14-15', '12-13', '10-11', '8-9', '5-7'];

const getWeightLabel = (name: string): string => {
  const m = name.match(/([-+±]\s*\d+[\d.,]*\s*kg)/i);
  return m ? m[1] : name;
};

const getAgeLabel = (name: string): string => {
  if (/^Ενήλικοι/i.test(name)) return '18-40';
  if (/^U23/i.test(name)) return 'U23';
  const match = name.match(/^Νέ(?:οι|ες)\s*(\d+-\d+)/);
  if (match) return match[1];
  return name.replace(/([-+±]\s*\d+[\d.,]*\s*kg)/i, '').trim();
};

const groupByAge = (cats: Category[]) => {
  const grouped = new Map<string, Category[]>();
  cats.forEach(cat => {
    const age = getAgeLabel(cat.name);
    if (!grouped.has(age)) grouped.set(age, []);
    grouped.get(age)!.push(cat);
  });
  // Show ordered groups first, then any remaining groups not in AGE_ORDER
  const orderedKeys = AGE_ORDER.filter(a => grouped.has(a));
  const remainingKeys = [...grouped.keys()].filter(k => !AGE_ORDER.includes(k));
  return [...orderedKeys, ...remainingKeys].map(age => ({
    age,
    cats: grouped.get(age)!,
  }));
};

// Separate component - each group manages its own open/close state
const AgeGroup: React.FC<{
  age: string;
  cats: Category[];
  filtered: Registration[];
  gender: string;
}> = ({ age, cats, filtered, gender }) => {
  const [isOpen, setIsOpen] = useState(false);

  const ageRegs = filtered.filter(r => cats.some(c => c.id === r.category_id));

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  return (
    <div className="mb-1 border border-border">
      <button
        type="button"
        onClick={handleToggle}
        className="w-full text-[11px] font-bold text-foreground bg-muted px-2 py-2.5 flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors select-none"
      >
        <span className="flex items-center gap-2">
          {isOpen
            ? <ChevronDown className="h-4 w-4 shrink-0 text-foreground" />
            : <ChevronRight className="h-4 w-4 shrink-0 text-foreground" />
          }
          {age}
        </span>
        <div className="flex items-center gap-1.5">
          {ageRegs.length > 0 && (
            <Badge className="rounded-none text-[9px] bg-foreground text-background h-4 px-1">
              {ageRegs.length}
            </Badge>
          )}
          <span className="text-[9px] text-muted-foreground">{cats.length} κατ.</span>
        </div>
      </button>
      {isOpen && (
        <div>
          {cats.map(cat => {
            const catRegs = filtered.filter(r => r.category_id === cat.id);
            return (
              <div key={cat.id} className="flex items-center gap-1.5 px-2 py-1 text-xs border-t border-border/30">
                <span className="font-medium min-w-[60px]">{getWeightLabel(cat.name)}</span>
                <div className="flex items-center gap-0.5 flex-1 justify-end">
                  {catRegs.map(reg => {
                    const name = reg.athlete?.name || 'Ά';
                    const avatar = reg.athlete?.photo_url || reg.athlete?.avatar_url || '';
                    return (
                      <Avatar key={reg.id} className="h-5 w-5 rounded-full">
                        <AvatarImage src={avatar} />
                        <AvatarFallback className="text-[8px] rounded-full">{name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const CompetitionRegistrationsDialog: React.FC<CompetitionRegistrationsDialogProps> = ({
  isOpen, onClose, competitionId, competitionName,
}) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchRegistrations();
      fetchCategories();
    }
  }, [isOpen, competitionId]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('federation_competition_categories')
      .select('id, name, gender')
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

  const filtered = registrations.filter(r => {
    if (!searchTerm) return true;
    return matchesSearchTerm(r.athlete?.name || '', searchTerm) ||
      matchesSearchTerm(r.club?.name || '', searchTerm) ||
      matchesSearchTerm(r.category?.name || '', searchTerm);
  });

  const maleCats = categories.filter(c => c.gender === 'male');
  const femaleCats = categories.filter(c => c.gender === 'female');
  const maleGroups = groupByAge(maleCats);
  const femaleGroups = groupByAge(femaleCats);


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
            <div className="flex gap-4">
              {/* Άνδρες */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-foreground px-2 py-2 border-b-2 border-foreground mb-1">
                  Άνδρες
                </div>
                {maleGroups.map(g => (
                  <AgeGroup
                    key={`male-${g.age}`}
                    age={g.age}
                    cats={g.cats}
                    filtered={filtered}
                    gender="male"
                  />
                ))}
              </div>
              {/* Γυναίκες */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-foreground px-2 py-2 border-b-2 border-foreground mb-1">
                  Γυναίκες
                </div>
                {femaleGroups.map(g => (
                  <AgeGroup
                    key={`female-${g.age}`}
                    age={g.age}
                    cats={g.cats}
                    filtered={filtered}
                    gender="female"
                  />
                ))}
              </div>
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
