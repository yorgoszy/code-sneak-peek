import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Scale, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  const [weighInEdit, setWeighInEdit] = useState<{ id: string; weight: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchRegistrations();
      fetchCategories();
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

  const handleWeighIn = async (regId: string, weight: string) => {
    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0) { toast.error('Μη έγκυρο βάρος'); return; }
    try {
      const { error } = await supabase
        .from('federation_competition_registrations')
        .update({
          weigh_in_weight: w,
          weigh_in_status: 'passed',
          weigh_in_date: new Date().toISOString(),
        })
        .eq('id', regId);
      if (error) throw error;
      toast.success('Ζύγιση καταχωρήθηκε');
      setWeighInEdit(null);
      fetchRegistrations();
    } catch (error) {
      console.error(error);
      toast.error('Σφάλμα');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      registered: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      withdrawn: 'bg-gray-100 text-gray-800',
      disqualified: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      registered: 'Δηλωμένος',
      confirmed: 'Επιβεβαιωμένος',
      withdrawn: 'Αποσύρθηκε',
      disqualified: 'Αποκλείστηκε',
    };
    return <Badge className={`rounded-none text-xs ${styles[status] || ''}`}>{labels[status] || status}</Badge>;
  };

  const getWeighInBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      passed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      no_show: 'bg-gray-100 text-gray-800',
    };
    const labels: Record<string, string> = {
      pending: 'Εκκρεμεί',
      passed: 'Επιτυχής',
      failed: 'Αποτυχία',
      no_show: 'Απών',
    };
    return <Badge className={`rounded-none text-xs ${styles[status] || ''}`}>{labels[status] || status}</Badge>;
  };

  // Group categories by age group (remove weight suffix)
  const grouped = new Map<string, Category[]>();
  categories.forEach(cat => {
    const groupName = cat.name
      .replace(/\s+[-+±(].*$/, '')
      .replace(/\s+\d+[\d.,]*\s*(kg)?$/i, '')
      .trim() || 'Άλλα';
    if (!grouped.has(groupName)) grouped.set(groupName, []);
    grouped.get(groupName)!.push(cat);
  });

  // Filter registrations by search
  const filtered = registrations.filter(r => {
    if (!searchTerm) return true;
    return matchesSearchTerm(r.athlete?.name || '', searchTerm) ||
      matchesSearchTerm(r.club?.name || '', searchTerm) ||
      matchesSearchTerm(r.category?.name || '', searchTerm);
  });

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
            <div className="space-y-1">
              {Array.from(grouped.entries()).map(([group, cats]) => {
                const groupRegs = filtered.filter(r => cats.some(c => c.id === r.category_id));
                
                return (
                  <Collapsible key={group}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-bold text-foreground bg-muted px-3 py-2 border-b border-border hover:bg-muted/80 cursor-pointer">
                      <span>{group} ({cats.length})</span>
                      <div className="flex items-center gap-2">
                        {groupRegs.length > 0 && (
                          <Badge className="rounded-none text-[10px] bg-foreground text-background h-5">
                            {groupRegs.length} αθλ.
                          </Badge>
                        )}
                        <ChevronDown className="h-3 w-3" />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {cats.map(cat => {
                        const catRegs = filtered.filter(r => r.category_id === cat.id);
                        
                        return (
                          <div key={cat.id} className="border-b border-border/50">
                            <div className="flex items-center gap-2 px-3 py-1.5 text-xs">
                              <span className="min-w-0 truncate font-medium">{cat.name}</span>
                              
                              {/* Athlete avatars */}
                              <div className="flex items-center gap-1 flex-1 justify-end">
                                {catRegs.map(reg => {
                                  const athleteName = reg.athlete?.name || 'Άγνωστος';
                                  const athleteAvatar = reg.athlete?.photo_url || reg.athlete?.avatar_url || '';
                                  return (
                                    <div key={reg.id} className="flex items-center gap-1.5 bg-accent/50 px-1.5 py-0.5 rounded-sm">
                                      <Avatar className="h-5 w-5 rounded-full">
                                        <AvatarImage src={athleteAvatar} />
                                        <AvatarFallback className="text-[8px] rounded-full">{athleteName.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      <span className="text-[10px] truncate max-w-[80px]">{athleteName}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
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
