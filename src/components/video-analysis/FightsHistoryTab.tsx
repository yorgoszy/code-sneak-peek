import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, Calendar, MapPin, User, Trophy, Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FightViewDialog } from './FightViewDialog';
import { FightEditDialog } from './FightEditDialog';

interface Fight {
  id: string;
  opponent_name: string | null;
  fight_date: string;
  result: string | null;
  fight_type: string | null;
  total_rounds: number | null;
  round_duration_seconds: number | null;
  location: string | null;
  weight_class: string | null;
  notes: string | null;
  video_url: string | null;
}

interface FightsHistoryTabProps {
  userId: string;
  onRefresh?: () => void;
}

export const FightsHistoryTab: React.FC<FightsHistoryTabProps> = ({ userId, onRefresh }) => {
  const [fights, setFights] = useState<Fight[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFight, setSelectedFight] = useState<Fight | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchFights = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('muaythai_fights')
        .select('*')
        .eq('user_id', userId)
        .order('fight_date', { ascending: false });

      if (error) throw error;
      setFights(data || []);
    } catch (error) {
      console.error('Error fetching fights:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία φόρτωσης αγώνων",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFights();
  }, [userId]);

  const handleDelete = async () => {
    if (!selectedFight) return;

    try {
      const { error } = await supabase
        .from('muaythai_fights')
        .delete()
        .eq('id', selectedFight.id);

      if (error) throw error;

      // Soft refresh - just update local state
      setFights(prev => prev.filter(f => f.id !== selectedFight.id));
      
      toast({
        title: "Επιτυχία",
        description: "Ο αγώνας διαγράφηκε"
      });
    } catch (error) {
      console.error('Error deleting fight:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία διαγραφής αγώνα",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedFight(null);
    }
  };

  const getResultBadge = (result: string | null) => {
    switch (result) {
      case 'win':
        return <Badge className="bg-green-500 hover:bg-green-600 rounded-none">Νίκη</Badge>;
      case 'loss':
        return <Badge className="bg-red-500 hover:bg-red-600 rounded-none">Ήττα</Badge>;
      case 'draw':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 rounded-none">Ισοπαλία</Badge>;
      case 'no_contest':
        return <Badge className="bg-gray-500 hover:bg-gray-600 rounded-none">Ακυρος</Badge>;
      default:
        return <Badge variant="outline" className="rounded-none">-</Badge>;
    }
  };

  const getFightTypeLabel = (type: string | null) => {
    switch (type) {
      case 'amateur': return 'Ερασιτεχνικός';
      case 'professional': return 'Επαγγελματικός';
      case 'sparring': return 'Sparring';
      default: return type || '-';
    }
  };

  if (loading) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (fights.length === 0) {
    return (
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Ιστορικό Αγώνων</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            Δεν υπάρχουν καταχωρημένοι αγώνες
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Ιστορικό Αγώνων ({fights.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {fights.map((fight) => (
            <Card key={fight.id} className="rounded-none border hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left side - Fight info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getResultBadge(fight.result)}
                      <Badge variant="outline" className="rounded-none">
                        {getFightTypeLabel(fight.fight_type)}
                      </Badge>
                      {fight.weight_class && (
                        <Badge variant="secondary" className="rounded-none">
                          {fight.weight_class}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                      {fight.opponent_name && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>vs {fight.opponent_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(fight.fight_date), 'dd MMM yyyy', { locale: el })}</span>
                      </div>
                      {fight.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{fight.location}</span>
                        </div>
                      )}
                    </div>

                    {fight.total_rounds && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{fight.total_rounds} γύροι</span>
                        {fight.round_duration_seconds && (
                          <span>× {Math.floor(fight.round_duration_seconds / 60)} λεπτά</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right side - Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-none"
                      onClick={() => {
                        setSelectedFight(fight);
                        setViewDialogOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-none"
                      onClick={() => {
                        setSelectedFight(fight);
                        setEditDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-none text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => {
                        setSelectedFight(fight);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Είστε σίγουροι;</AlertDialogTitle>
            <AlertDialogDescription>
              Αυτή η ενέργεια δεν μπορεί να αναιρεθεί. Ο αγώνας και όλα τα σχετικά δεδομένα θα διαγραφούν οριστικά.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive hover:bg-destructive/90 rounded-none"
            >
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Dialog */}
      <FightViewDialog
        isOpen={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setSelectedFight(null);
        }}
        fight={selectedFight}
      />

      {/* Edit Dialog */}
      <FightEditDialog
        isOpen={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedFight(null);
        }}
        fight={selectedFight}
        onSave={() => {
          fetchFights();
          onRefresh?.();
        }}
      />
    </>
  );
};
