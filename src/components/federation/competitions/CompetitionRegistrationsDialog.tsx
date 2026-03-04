import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Scale } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [weighInEdit, setWeighInEdit] = useState<{ id: string; weight: string } | null>(null);

  useEffect(() => {
    if (isOpen) fetchRegistrations();
  }, [isOpen, competitionId]);

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

  const filtered = registrations.filter(r => {
    if (!searchTerm) return true;
    return matchesSearchTerm(r.athlete?.name || '', searchTerm) ||
      matchesSearchTerm(r.club?.name || '', searchTerm) ||
      matchesSearchTerm(r.category?.name || '', searchTerm);
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle>Δηλώσεις - {competitionName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              {registrations.length === 0 ? 'Δεν υπάρχουν δηλώσεις ακόμα' : 'Δεν βρέθηκαν αποτελέσματα'}
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map(reg => (
                <div key={reg.id} className="flex items-center justify-between p-3 border rounded-none">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={reg.athlete?.photo_url || reg.athlete?.avatar_url || ''} />
                      <AvatarFallback className="text-xs">
                        {reg.athlete?.name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{reg.athlete?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{reg.club?.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-none text-xs">{reg.category?.name}</Badge>
                    {getStatusBadge(reg.registration_status)}
                    {getWeighInBadge(reg.weigh_in_status)}

                    {reg.weigh_in_weight && (
                      <span className="text-xs font-medium">{reg.weigh_in_weight} kg</span>
                    )}

                    {weighInEdit?.id === reg.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          step="0.1"
                          value={weighInEdit.weight}
                          onChange={e => setWeighInEdit({ ...weighInEdit, weight: e.target.value })}
                          className="w-20 h-8 rounded-none text-xs"
                          placeholder="kg"
                        />
                        <Button size="sm" className="h-8 rounded-none bg-foreground text-background" onClick={() => handleWeighIn(reg.id, weighInEdit.weight)}>
                          OK
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 rounded-none" onClick={() => setWeighInEdit(null)}>✕</Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-none h-8"
                        onClick={() => setWeighInEdit({ id: reg.id, weight: reg.weigh_in_weight?.toString() || '' })}
                      >
                        <Scale className="h-3 w-3 mr-1" /> Ζύγιση
                      </Button>
                    )}
                  </div>
                </div>
              ))}
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
