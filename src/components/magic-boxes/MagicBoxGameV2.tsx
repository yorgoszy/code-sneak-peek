import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Sparkles, Trophy, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProgramCalendarDialog } from "@/components/programs/ProgramCalendarDialog";
import { useProgramCalendarDialog } from "@/hooks/useProgramCalendarDialog";
import { MagicBoxGridGame } from './MagicBoxGridGame';

interface MagicBoxCampaign {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  max_participations_per_user: number;
}

interface UserMagicBox {
  id: string;
  campaign_id: string;
  is_opened: boolean;
  opened_at: string | null;
  won_prize_id: string | null;
  magic_box_campaigns: MagicBoxCampaign;
  campaign_prizes?: {
    prize_type: string;
    subscription_type_id: string | null;
    subscription_types?: {
      name: string;
      duration_months: number;
    };
  };
}

export const MagicBoxGameV2: React.FC = () => {
  const [userMagicBoxes, setUserMagicBoxes] = useState<UserMagicBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [openingBoxId, setOpeningBoxId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState<any>(null);
  const [selectedBoxForGame, setSelectedBoxForGame] = useState<UserMagicBox | null>(null);
  const [showGridGame, setShowGridGame] = useState(false);
  
  const { toast } = useToast();
  const {
    isOpen: showProgramCalendar,
    programId,
    checkAndShowProgramCalendar,
    close: closeProgramCalendar
  } = useProgramCalendarDialog();

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    // Subscribe to real-time updates for user_magic_boxes
    const subscription = supabase
      .channel('magic_boxes_changes')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'user_magic_boxes',
          filter: `user_id=eq.${currentUserId}`
        }, 
        (payload) => {
          console.log('🔄 Magic box updated for current user:', payload);
          // Only refresh if the update is for the current user
          loadUserMagicBoxes(currentUserId);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUserId]);

  const initializeUser = async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        console.error('User not authenticated');
        return;
      }

      console.log('🔧 Auth user ID:', userData.user.id);

      // Βρίσκουμε το app_users record του χρήστη
      const { data: appUser, error: appUserError } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_user_id', userData.user.id)
        .single();

      if (appUserError || !appUser) {
        console.error('App user not found:', appUserError);
        return;
      }

      console.log('🔧 Current user initialized:', appUser.id);
      setCurrentUserId(appUser.id);
      await loadUserMagicBoxes(appUser.id);
    } catch (error) {
      console.error('Error initializing user:', error);
      setLoading(false);
    }
  };

  const loadUserMagicBoxes = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_magic_boxes')
        .select(`
          *,
          magic_box_campaigns!inner(*),
          campaign_prizes(
            prize_type,
            subscription_type_id,
            subscription_types(
              name,
              duration_months
            )
          )
        `)
        .eq('user_id', userId)
        .eq('magic_box_campaigns.is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserMagicBoxes(data || []);
      console.log('🔧 User magic boxes loaded:', data?.length);
      console.log('📦 Magic boxes data:', data);
    } catch (error) {
      console.error('Error loading magic boxes:', error);
      toast({
        title: 'Σφάλμα',
        description: 'Αποτυχία φόρτωσης μαγικών κουτιών',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const openMagicBox = async (boxId: string) => {
    console.log(`🎯 Opening magic box: ${boxId}`);
    
    if (!currentUserId) {
      toast({
        title: 'Σφάλμα',
        description: 'Δεν είστε συνδεδεμένοι',
        variant: 'destructive'
      });
      return;
    }

    const box = userMagicBoxes.find(b => b.id === boxId);
    if (!box) {
      toast({
        title: 'Σφάλμα',
        description: 'Μαγικό κουτί δεν βρέθηκε',
        variant: 'destructive'
      });
      return;
    }

    if (box.is_opened) {
      toast({
        title: 'Ωχ!',
        description: 'Έχεις ήδη ανοίξει αυτό το μαγικό κουτί!',
        variant: 'destructive'
      });
      return;
    }

    if (openingBoxId) {
      console.log(`⏳ Already opening a box: ${openingBoxId}`);
      return;
    }

    setOpeningBoxId(boxId);
    
    console.log('🚀 About to call magic-box-open function');

    try {
      const { data, error } = await supabase.functions.invoke('magic-box-open', {
        body: { magic_box_id: boxId }
      });

      console.log('📡 Function response:', { data, error });

      if (error) {
        console.error(`Error opening box:`, error);
        if (data?.message) {
          toast({
            title: 'Ωχ!',
            description: data.message,
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Σφάλμα',
            description: 'Κάτι πήγε στραβά. Δοκιμάστε ξανά.',
            variant: 'destructive'
          });
        }
        return;
      }

      if (data?.success) {
        console.log(`🎉 Box opened successfully:`, data.message);
        
        // Αποθηκεύουμε το αποτέλεσμα για εμφάνιση
        setShowResult(data);
        
        // Έλεγχος αν κέρδισε συνδρομή με πρόγραμμα
        if (data.prize_type === 'subscription' && data.subscription_type_id) {
          await checkAndShowProgramCalendar(data.subscription_type_id);
        }
        
        toast({
          title: 'Συγχαρητήρια! 🎉',
          description: data.message,
        });
        
        // Ανανέωση των magic boxes
        await loadUserMagicBoxes(currentUserId);
      } else {
        console.log(`😞 Box opening failed:`, data?.message);
        toast({
          title: 'Ωχ!',
          description: data?.message || 'Δεν κέρδισες αυτή τη φορά',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error(`Error opening box ${boxId}:`, error);
      toast({
        title: 'Σφάλμα',
        description: 'Κάτι πήγε στραβά. Δοκιμάστε ξανά.',
        variant: 'destructive'
      });
    } finally {
      setOpeningBoxId(null);
    }
  };

  const formatDate = (dateString: string) => {
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
        <h2 className="text-3xl font-bold mb-2">Τα Μαγικά μου Κουτιά</h2>
        <p className="text-gray-600">Άνοιξε τα μαγικά κουτιά σου και κέρδισε υπέροχα δώρα!</p>
      </div>

      {/* User's Magic Boxes */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {userMagicBoxes.map((box) => (
          <div key={box.id} className="relative flex justify-center">
            {/* 3D Magic Box */}
            <div className="relative">
              {/* Main Box */}
              <div 
                className={`
                  relative w-48 h-48 cursor-pointer transition-all duration-300 hover:scale-105
                  ${box.is_opened ? 'transform-gpu' : 'hover:rotate-y-12'}
                `}
                style={{
                  transformStyle: 'preserve-3d',
                  perspective: '1000px'
                }}
              >
                {/* Front Face */}
                <div 
                  className={`
                    absolute inset-0 w-48 h-48 border-4 flex flex-col items-center justify-center
                    ${box.is_opened 
                      ? 'bg-gradient-to-br from-[#00ffba]/20 to-[#00ffba]/40 border-[#00ffba]' 
                      : 'bg-gradient-to-br from-purple-500 to-pink-500 border-purple-600'
                    }
                    rounded-lg shadow-xl transform-gpu
                  `}
                  style={{
                    transform: 'translateZ(24px)'
                  }}
                >
                  <Gift className={`w-12 h-12 mb-3 ${box.is_opened ? 'text-[#00ffba]' : 'text-white'}`} />
                  <h3 className={`text-lg font-bold text-center px-2 ${box.is_opened ? 'text-[#00ffba]' : 'text-white'}`}>
                    {box.magic_box_campaigns.name}
                  </h3>
                  
                  {/* Prize Content inside opened box */}
                  {box.is_opened && box.campaign_prizes?.subscription_types && (
                    <div className="mt-3 text-center">
                      <div className="bg-white/90 px-3 py-2 rounded border-2 border-[#00ffba]">
                        <div className="font-bold text-[#00ffba] text-sm">
                          {box.campaign_prizes.subscription_types.name}
                        </div>
                        {box.campaign_prizes.subscription_types.duration_months > 0 && (
                          <div className="text-xs text-gray-600">
                            {box.campaign_prizes.subscription_types.duration_months} μήνες
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Face */}
                <div 
                  className={`
                    absolute top-0 right-0 w-6 h-48 
                    ${box.is_opened 
                      ? 'bg-gradient-to-b from-[#00ffba]/30 to-[#00ffba]/50 border-r-2 border-t-2 border-b-2 border-[#00ffba]' 
                      : 'bg-gradient-to-b from-purple-600 to-purple-700 border-r-2 border-t-2 border-b-2 border-purple-700'
                    }
                    rounded-r-lg transform-gpu
                  `}
                  style={{
                    transform: 'rotateY(90deg) translateZ(24px)',
                    transformOrigin: 'right'
                  }}
                />

                {/* Top Face */}
                <div 
                  className={`
                    absolute top-0 left-0 w-48 h-6 
                    ${box.is_opened 
                      ? 'bg-gradient-to-r from-[#00ffba]/40 to-[#00ffba]/60 border-t-2 border-l-2 border-r-2 border-[#00ffba]' 
                      : 'bg-gradient-to-r from-purple-400 to-purple-500 border-t-2 border-l-2 border-r-2 border-purple-500'
                    }
                    rounded-t-lg transform-gpu
                  `}
                  style={{
                    transform: 'rotateX(90deg) translateZ(24px)',
                    transformOrigin: 'top'
                  }}
                />
              </div>

              {/* Box Info */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 mb-3">{box.magic_box_campaigns.description}</p>
                
                {box.is_opened ? (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">
                      Άνοιξε στις: {formatDate(box.opened_at!)}
                    </p>
                    <Badge variant="secondary" className="rounded-none">
                      Ολοκληρωμένο
                    </Badge>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      setSelectedBoxForGame(box);
                      setShowGridGame(true);
                    }}
                    disabled={openingBoxId === box.id}
                    className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    Παίξε το Παιχνίδι!
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
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
            
            {showResult.prize_type === 'subscription' && showResult.subscription_type_id && (
              <div className="bg-white p-4 rounded-lg border mb-4">
                <h3 className="font-bold text-lg">{showResult.prize_name}</h3>
                <p className="text-gray-600">{showResult.prize_description}</p>
                <Badge className="bg-[#00ffba] text-black rounded-none mt-2">
                  Συνδρομή
                </Badge>
              </div>
            )}
            
            {showResult.prize_type === 'visit_package' && (
              <div className="bg-white p-4 rounded-lg border mb-4">
                <h3 className="font-bold text-lg">{showResult.prize_name}</h3>
                <p className="text-gray-600">{showResult.prize_description}</p>
                <Badge className="bg-[#00ffba] text-black rounded-none mt-2">
                  {showResult.visit_count} επισκέψεις
                  {showResult.merged_with_existing && (
                    <span className="ml-2 text-xs">(προστέθηκαν στις υπάρχουσες)</span>
                  )}
                </Badge>
                {showResult.total_visits_now && (
                  <p className="text-sm text-gray-500 mt-2">
                    Σύνολο διαθέσιμων επισκέψεων: {showResult.total_visits_now}
                  </p>
                )}
              </div>
            )}
            
            {showResult.prize_type === 'videocall_package' && (
              <div className="bg-white p-4 rounded-lg border mb-4">
                <h3 className="font-bold text-lg">{showResult.prize_name}</h3>
                <p className="text-gray-600">{showResult.prize_description}</p>
                <Badge className="bg-[#00ffba] text-black rounded-none mt-2">
                  {showResult.videocall_count} βιντεοκλήσεις
                  {showResult.merged_with_existing && (
                    <span className="ml-2 text-xs">(προστέθηκαν στις υπάρχουσες)</span>
                  )}
                </Badge>
                {showResult.total_videocalls_now && (
                  <p className="text-sm text-gray-500 mt-2">
                    Σύνολο διαθέσιμων βιντεοκλήσεων: {showResult.total_videocalls_now}
                  </p>
                )}
              </div>
            )}
            
            {showResult.prize_type === 'discount_coupon' && (
              <div className="bg-white p-4 rounded-lg border mb-4">
                <Ticket className="w-8 h-8 mx-auto mb-2 text-[#00ffba]" />
                <h3 className="font-bold text-lg">Κουπόνι Έκπτωσης</h3>
                <p className="text-2xl font-bold text-[#00ffba]">{showResult.discount_percentage}% OFF</p>
                {showResult.discount_code && (
                  <p className="text-sm text-gray-600 mt-2">
                    Κωδικός: <span className="font-mono">{showResult.discount_code}</span>
                  </p>
                )}
              </div>
            )}
            
            <Button
              onClick={() => {
                setShowResult(null);
                // Ανανέωση magic boxes για να εμφανιστεί η ενημέρωση
                if (currentUserId) {
                  loadUserMagicBoxes(currentUserId);
                }
              }}
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
            >
              Τέλεια!
            </Button>
          </CardContent>
        </Card>
      )}

      {/* No magic boxes message */}
      {userMagicBoxes.length === 0 && (
        <div className="text-center py-8">
          <Gift className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">Δεν έχεις μαγικά κουτιά</h3>
          <p className="text-gray-500">Ελέγξτε ξανά σύντομα για νέα μαγικά κουτιά!</p>
        </div>
      )}

      <ProgramCalendarDialog
        isOpen={showProgramCalendar}
        onClose={closeProgramCalendar}
        programId={programId}
        onComplete={() => loadUserMagicBoxes(currentUserId!)}
      />

      <MagicBoxGridGame
        isOpen={showGridGame}
        onClose={() => {
          setShowGridGame(false);
          setSelectedBoxForGame(null);
        }}
        magicBox={selectedBoxForGame}
        onPrizeWon={(prize) => {
          setShowResult({
            success: true,
            message: `Συγχαρητήρια! Κερδίσατε: ${prize.name}!`,
            prize_name: prize.name,
            prize_description: prize.description,
            prize_type: 'custom'
          });
          setShowGridGame(false);
          setSelectedBoxForGame(null);
          // Ανανέωση των magic boxes
          if (currentUserId) {
            loadUserMagicBoxes(currentUserId);
          }
        }}
      />
    </div>
  );
};