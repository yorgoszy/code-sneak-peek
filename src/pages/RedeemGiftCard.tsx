import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Gift, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { UserSearchCombobox } from '@/components/users/UserSearchCombobox';
import { format, addMonths } from 'date-fns';

const RedeemGiftCard: React.FC = () => {
  const [params] = useSearchParams();
  const code = (params.get('code') || '').toUpperCase().trim();
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin, userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [card, setCard] = useState<any>(null);
  const [subType, setSubType] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(`/redeem?code=${code}`)}`);
      return;
    }
    if (!isAdmin()) {
      setError('Μόνο διαχειριστές μπορούν να εξαργυρώσουν gift cards.');
      setLoading(false);
      return;
    }
    if (!code) {
      setError('Δεν βρέθηκε κωδικός στο URL.');
      setLoading(false);
      return;
    }
    loadCard();
  }, [authLoading, user, code]);

  const loadCard = async () => {
    setLoading(true);
    try {
      const { data: gc, error: e1 } = await supabase
        .from('gift_cards')
        .select('*')
        .eq('code', code)
        .maybeSingle();

      if (e1 || !gc) {
        setError('Η κάρτα δεν βρέθηκε.');
        return;
      }
      if (gc.status !== 'active') {
        setError(gc.status === 'redeemed' ? 'Η κάρτα έχει ήδη εξαργυρωθεί.' : 'Η κάρτα δεν είναι ενεργή.');
        setCard(gc);
        return;
      }
      if (gc.expires_at && new Date(gc.expires_at) < new Date()) {
        setError('Η κάρτα έχει λήξει.');
        setCard(gc);
        return;
      }
      setCard(gc);

      if (gc.subscription_type_id) {
        const { data: st } = await supabase
          .from('subscription_types')
          .select('*')
          .eq('id', gc.subscription_type_id)
          .maybeSingle();
        setSubType(st);
      }

      // Try to pre-select user by recipient_email
      if (gc.recipient_email) {
        const { data: matchUser } = await supabase
          .from('app_users')
          .select('id')
          .ilike('email', gc.recipient_email.trim())
          .maybeSingle();
        if (matchUser) setSelectedUserId(matchUser.id);
      }
    } catch (err: any) {
      setError(err.message || 'Σφάλμα φόρτωσης');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!selectedUserId) {
      toast.error('Επιλέξτε χρήστη');
      return;
    }
    if (!card) return;

    setSubmitting(true);
    try {
      const startDate = new Date();
      const months = subType?.duration_months || 1;
      const endDate = addMonths(startDate, months);

      // Create subscription
      const { error: insErr } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: selectedUserId,
          subscription_type_id: card.subscription_type_id,
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          status: 'active',
          is_paid: true,
          notes: `Gift Card: ${card.code}`,
        });

      if (insErr) throw insErr;

      // Activate user
      await supabase
        .from('app_users')
        .update({ user_status: 'active', subscription_status: 'active' })
        .eq('id', selectedUserId);

      // Mark card redeemed
      const { error: updErr } = await supabase
        .from('gift_cards')
        .update({
          status: 'redeemed',
          redeemed_by: selectedUserId,
          redeemed_at: new Date().toISOString(),
        })
        .eq('id', card.id);

      if (updErr) throw updErr;

      toast.success('Η κάρτα εξαργυρώθηκε και η συνδρομή ενεργοποιήθηκε!');
      setDone(true);
    } catch (err: any) {
      console.error(err);
      toast.error('Σφάλμα: ' + (err.message || 'unknown'));
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 flex items-start justify-center pt-12">
      <Card className="w-full max-w-md rounded-none border-2 border-black">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-black pb-3">
            <Gift className="h-6 w-6" />
            <h1 className="text-xl font-bold">Εξαργύρωση Gift Card</h1>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-black text-white p-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {card && (
            <div className="space-y-2 text-sm border border-black p-3">
              <div className="flex justify-between"><span className="text-muted-foreground">Κωδικός:</span><span className="font-mono font-bold">{card.code}</span></div>
              {subType && <div className="flex justify-between"><span className="text-muted-foreground">Συνδρομή:</span><span className="font-semibold">{subType.name}</span></div>}
              {subType?.duration_months && <div className="flex justify-between"><span className="text-muted-foreground">Διάρκεια:</span><span>{subType.duration_months} μήνες</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Αξία:</span><span className="font-bold">€{card.amount}</span></div>
              {card.recipient_name && <div className="flex justify-between"><span className="text-muted-foreground">Παραλήπτης:</span><span>{card.recipient_name}</span></div>}
              {card.recipient_email && <div className="flex justify-between"><span className="text-muted-foreground">Email:</span><span className="text-xs">{card.recipient_email}</span></div>}
            </div>
          )}

          {done ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle className="h-16 w-16 mx-auto text-black" />
              <p className="font-bold">Επιτυχής εξαργύρωση!</p>
              <Button onClick={() => navigate('/dashboard/gift-cards')} className="rounded-none bg-black text-white hover:bg-gray-800">
                Επιστροφή
              </Button>
            </div>
          ) : card && !error && (
            <>
              <div className="space-y-2">
                <Label>Χρήστης</Label>
                <UserSearchCombobox
                  value={selectedUserId}
                  onValueChange={(v) => setSelectedUserId(v || '')}
                  placeholder="Επιλέξτε χρήστη..."
                  coachId={userProfile?.id}
                  adminOwned
                />
                {card.recipient_email && (
                  <p className="text-xs text-muted-foreground">Πρόταση: {card.recipient_email}</p>
                )}
              </div>

              <Button
                onClick={handleRedeem}
                disabled={submitting || !selectedUserId}
                className="w-full rounded-none bg-black text-white hover:bg-gray-800 font-semibold"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Δημιουργία Συνδρομής & Εξαργύρωση'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RedeemGiftCard;
