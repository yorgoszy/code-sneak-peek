import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Sparkles, Trophy, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MagicBox {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  is_free: boolean;
}

interface UserWin {
  id: string;
  prize_type: string;
  discount_percentage: number;
  subscription_type_id: string | null;
  is_claimed: boolean;
  won_at: string;
  magic_box_id: string;
  subscription_types?: {
    name: string;
    description: string;
  } | null;
}

export const MagicBoxGame: React.FC = () => {
  const [magicBoxes, setMagicBoxes] = useState<MagicBox[]>([]);
  const [userWins, setUserWins] = useState<UserWin[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingBox, setPlayingBox] = useState<string | null>(null);
  const [showResult, setShowResult] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMagicBoxes();
    fetchUserWins();
  }, []);

  const fetchMagicBoxes = async () => {
    try {
      const { data, error } = await supabase
        .from('magic_boxes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMagicBoxes(data || []);
    } catch (error) {
      console.error('Error fetching magic boxes:', error);
      toast({
        title: 'Σφάλμα',
        description: 'Αποτυχία φόρτωσης μαγικών κουτιών',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserWins = async () => {
    try {
      const { data, error } = await supabase
        .from('user_magic_box_wins')
        .select(`
          *,
          subscription_types (
            name,
            description
          )
        `)
        .order('won_at', { ascending: false });

      if (error) throw error;
      setUserWins((data || []) as UserWin[]);
    } catch (error) {
      console.error('Error fetching user wins:', error);
    }
  };

  const playMagicBox = async (magicBoxId: string) => {
    setPlayingBox(magicBoxId);
    setShowResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('magic-box-draw', {
        body: { magic_box_id: magicBoxId }
      });

      if (error) throw error;

      if (data.success) {
        setShowResult(data);
        toast({
          title: 'Συγχαρητήρια! 🎉',
          description: data.message,
        });
        
        // Refresh user wins
        fetchUserWins();
      } else {
        toast({
          title: 'Ωχ!',
          description: data.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error playing magic box:', error);
      toast({
        title: 'Σφάλμα',
        description: 'Κάτι πήγε στραβά. Δοκιμάστε ξανά.',
        variant: 'destructive'
      });
    } finally {
      setPlayingBox(null);
    }
  };

  const hasPlayedBox = (boxId: string) => {
    // Κάθε χρήστης έχει μόνο μία προσπάθεια ανά ενεργό magic box
    return userWins.some(win => win.magic_box_id === boxId);
  };

  const formatWinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('el-GR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ffba]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Μαγικά Κουτιά</h2>
        <p className="text-gray-600">Δοκίμασε την τύχη σου και κέρδισε υπέροχα δώρα!</p>
      </div>

      {/* Available Magic Boxes */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {magicBoxes.map((box) => {
          const alreadyPlayed = hasPlayedBox(box.id);
          return (
            <Card key={box.id} className="rounded-none relative overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="w-6 h-6" />
                    {box.name}
                  </div>
                  {box.is_free && (
                    <Badge className="bg-[#00ffba] text-black rounded-none">
                      ΔΩΡΕΑΝ
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-gray-600 mb-4">{box.description}</p>
                
                <Button
                  onClick={() => playMagicBox(box.id)}
                  disabled={playingBox === box.id || alreadyPlayed}
                  className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                >
                  {playingBox === box.id ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      Παίζω...
                    </>
                  ) : alreadyPlayed ? (
                    'Έχεις ήδη παίξει'
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-2" />
                      Παίξε Τώρα!
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Win Result Modal */}
      {showResult && (
        <Card className="rounded-none border-2 border-[#00ffba] bg-gradient-to-r from-green-50 to-blue-50">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Trophy className="w-8 h-8 text-[#00ffba]" />
              Συγχαρητήρια!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-lg mb-4">{showResult.message}</p>
            
            {showResult.prize_type === 'subscription' && showResult.subscription_name && (
              <div className="bg-white p-4 rounded-lg border mb-4">
                <h3 className="font-bold text-lg">{showResult.subscription_name}</h3>
                <p className="text-gray-600">{showResult.subscription_description}</p>
                {showResult.discount_percentage > 0 && (
                  <Badge className="bg-[#00ffba] text-black rounded-none mt-2">
                    {showResult.discount_percentage}% έκπτωση
                  </Badge>
                )}
              </div>
            )}
            
            {showResult.prize_type === 'discount_coupon' && (
              <div className="bg-white p-4 rounded-lg border mb-4">
                <Ticket className="w-8 h-8 mx-auto mb-2 text-[#00ffba]" />
                <h3 className="font-bold text-lg">Κουπόνι Έκπτωσης</h3>
                <p className="text-2xl font-bold text-[#00ffba]">{showResult.discount_percentage}% OFF</p>
                <p className="text-sm text-gray-600 mt-2">
                  Χρησιμοποίησε το στις αγορές σου!
                </p>
              </div>
            )}
            
            <Button
              onClick={() => setShowResult(null)}
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
            >
              Τέλεια!
            </Button>
          </CardContent>
        </Card>
      )}

      {/* User's Wins History */}
      {userWins.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4">Τα Δώρα Μου</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {userWins.map((win) => (
              <Card key={win.id} className="rounded-none">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {win.prize_type === 'subscription' ? (
                        <Gift className="w-4 h-4" />
                      ) : (
                        <Ticket className="w-4 h-4" />
                      )}
                      {win.prize_type === 'subscription' ? 'Συνδρομή' : 'Κουπόνι'}
                    </div>
                    {win.is_claimed ? (
                      <Badge className="bg-[#00ffba] text-black rounded-none text-xs">
                        Ενεργοποιημένο
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="rounded-none text-xs">
                        Εκκρεμεί
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {win.subscription_types && (
                    <div className="mb-2">
                      <p className="font-medium text-sm">{win.subscription_types.name}</p>
                      <p className="text-xs text-gray-600">{win.subscription_types.description}</p>
                    </div>
                  )}
                  
                  {win.discount_percentage > 0 && (
                    <div className="mb-2">
                      <Badge className="bg-[#00ffba] text-black rounded-none text-xs">
                        {win.discount_percentage}% έκπτωση
                      </Badge>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500">
                    Κέρδισες: {formatWinDate(win.won_at)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {magicBoxes.length === 0 && (
        <Card className="rounded-none">
          <CardContent className="text-center py-8">
            <Gift className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Δεν υπάρχουν διαθέσιμα μαγικά κουτιά αυτή τη στιγμή</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};