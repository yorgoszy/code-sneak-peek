import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Sparkles, Trophy, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MagicBoxCampaign {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  max_participations_per_user: number;
}

interface UserParticipation {
  id: string;
  result_type: string;
  discount_percentage: number;
  subscription_type_id: string | null;
  discount_code: string | null;
  is_claimed: boolean;
  created_at: string;
  campaign_id: string;
}

export const MagicBoxGame: React.FC = () => {
  const [campaigns, setCampaigns] = useState<MagicBoxCampaign[]>([]);
  const [userParticipations, setUserParticipations] = useState<UserParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sessionId] = useState<string>(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [forceRender, setForceRender] = useState(0);
  const { toast } = useToast();

  // Session-specific state keys
  const getPlayingStateKey = (campaignId: string) => `playing_${sessionId}_${currentUserId}_${campaignId}`;
  const getResultStateKey = (campaignId: string) => `result_${sessionId}_${currentUserId}_${campaignId}`;

  // Force re-render function
  const triggerRender = () => setForceRender(prev => prev + 1);

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        console.error('User not authenticated');
        return;
      }

      // Βρίσκουμε το app_users record του χρήστη
      const { data: appUser, error: appUserError } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_user_id', userData.user.id)
        .single();

      if (appUserError || !appUser) {
        console.error('App user not found');
        return;
      }

      setCurrentUserId(appUser.id);
      fetchCampaigns();
      fetchUserParticipations(appUser.id);
    } catch (error) {
      console.error('Error initializing user:', error);
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('magic_box_campaigns')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: 'Σφάλμα',
        description: 'Αποτυχία φόρτωσης εκστρατειών',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserParticipations = async (userId?: string) => {
    try {
      const userIdToUse = userId || currentUserId;
      if (!userIdToUse) return;

      const { data, error } = await supabase
        .from('user_campaign_participations')
        .select('*')
        .eq('user_id', userIdToUse)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserParticipations((data || []) as UserParticipation[]);
    } catch (error) {
      console.error('Error fetching user participations:', error);
    }
  };

  const playCampaign = async (campaignId: string) => {
    if (!currentUserId) {
      toast({
        title: 'Σφάλμα',
        description: 'Δεν είστε συνδεδεμένοι',
        variant: 'destructive'
      });
      return;
    }

    // Έλεγχος αν ο χρήστης έχει ήδη παίξει σε αυτή την εκστρατεία
    if (hasPlayedCampaign(campaignId)) {
      toast({
        title: 'Ωχ!',
        description: 'Έχεις ήδη συμμετάσχει σε αυτή την εκστρατεία!',
        variant: 'destructive'
      });
      return;
    }

    // Χρησιμοποιούμε sessionStorage για session-specific state
    const playingKey = getPlayingStateKey(campaignId);
    sessionStorage.setItem(playingKey, 'true');
    
    // Trigger re-render by updating force render state
    triggerRender();

    try {
      const { data, error } = await supabase.functions.invoke('magic-box-draw', {
        body: { campaign_id: campaignId }
      });

      if (error) throw error;

      if (data.success) {
        const resultKey = getResultStateKey(campaignId);
        sessionStorage.setItem(resultKey, JSON.stringify(data));
        
        toast({
          title: 'Συγχαρητήρια! 🎉',
          description: data.message,
        });
        
        // Refresh user participations and campaigns
        await Promise.all([
          fetchUserParticipations(),
          fetchCampaigns()
        ]);
      } else {
        toast({
          title: 'Ωχ!',
          description: data.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error playing campaign:', error);
      toast({
        title: 'Σφάλμα',
        description: 'Κάτι πήγε στραβά. Δοκιμάστε ξανά.',
        variant: 'destructive'
      });
    } finally {
      sessionStorage.removeItem(playingKey);
      // Trigger re-render
      triggerRender();
    }
  };

  const isPlayingCampaign = (campaignId: string) => {
    if (!currentUserId) return false;
    const playingKey = getPlayingStateKey(campaignId);
    return sessionStorage.getItem(playingKey) === 'true';
  };

  const getUserCampaignResult = (campaignId: string) => {
    if (!currentUserId) return null;
    const resultKey = getResultStateKey(campaignId);
    const stored = sessionStorage.getItem(resultKey);
    return stored ? JSON.parse(stored) : null;
  };

  const hideResult = (campaignId: string) => {
    if (!currentUserId) return;
    const resultKey = getResultStateKey(campaignId);
    sessionStorage.removeItem(resultKey);
    // Trigger re-render
    triggerRender();
  };

  const hasPlayedCampaign = (campaignId: string) => {
    return userParticipations.some(participation => participation.campaign_id === campaignId);
  };

  const formatParticipationDate = (dateString: string) => {
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

      {/* Available Campaigns */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign) => {
          const alreadyPlayed = hasPlayedCampaign(campaign.id);
          return (
            <Card key={campaign.id} className="rounded-none relative overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="w-6 h-6" />
                    {campaign.name}
                  </div>
                  <Badge className="bg-[#00ffba] text-black rounded-none">
                    ΔΩΡΕΑΝ
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-gray-600 mb-4">{campaign.description}</p>
                
                <Button
                  onClick={() => playCampaign(campaign.id)}
                  disabled={isPlayingCampaign(campaign.id) || alreadyPlayed}
                  className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                >
                  {isPlayingCampaign(campaign.id) ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      Παίζω...
                    </>
                  ) : alreadyPlayed ? (
                    'Έχεις ήδη συμμετάσχει'
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-2" />
                      Συμμετοχή!
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Win Result Modals - Per Campaign */}
      {campaigns.map(campaign => {
        const showResult = getUserCampaignResult(campaign.id);
        if (!showResult) return null;
        
        return (
          <Card key={`result-${campaign.id}`} className="rounded-none border-2 border-[#00ffba] bg-gradient-to-r from-green-50 to-blue-50">
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
                  {showResult.visit_count && (
                    <Badge className="bg-[#00ffba] text-black rounded-none mt-2">
                      {showResult.visit_count} επισκέψεις
                    </Badge>
                  )}
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
                onClick={() => hideResult(campaign.id)}
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
              >
                Τέλεια!
              </Button>
            </CardContent>
          </Card>
        );
      })}

      {/* User's Participations History */}
      {userParticipations.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4">Οι Συμμετοχές Μου</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {userParticipations.map((participation) => (
              <Card key={participation.id} className="rounded-none">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {participation.result_type === 'subscription' ? (
                        <Gift className="w-4 h-4" />
                      ) : participation.result_type === 'discount_coupon' ? (
                        <Ticket className="w-4 h-4" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {participation.result_type === 'subscription' ? 'Συνδρομή' : 
                       participation.result_type === 'discount_coupon' ? 'Κουπόνι' : 
                       participation.result_type === 'try_again' ? 'Δοκίμασε ξανά' : 'Δώρο'}
                    </div>
                    {participation.is_claimed ? (
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
                  {participation.subscription_type_id && (
                    <div className="mb-2">
                      <p className="font-medium text-sm">Συνδρομή ID: {participation.subscription_type_id}</p>
                    </div>
                  )}
                  
                  {participation.discount_percentage > 0 && (
                    <div className="mb-2">
                      <Badge className="bg-[#00ffba] text-black rounded-none text-xs">
                        {participation.discount_percentage}% έκπτωση
                      </Badge>
                    </div>
                  )}

                  {participation.discount_code && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-600">Κωδικός: <span className="font-mono">{participation.discount_code}</span></p>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500">
                    Συμμετοχή: {formatParticipationDate(participation.created_at)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {campaigns.length === 0 && (
        <Card className="rounded-none">
          <CardContent className="text-center py-8">
            <Gift className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Δεν υπάρχουν διαθέσιμες εκστρατείες αυτή τη στιγμή</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};