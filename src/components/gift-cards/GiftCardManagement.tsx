import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Gift, Plus, Copy, Eye, Ban, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { GiftCardPDFDialog } from './GiftCardPDFDialog';

interface GiftCard {
  id: string;
  code: string;
  card_type: string;
  amount: number | null;
  subscription_type_id: string | null;
  sender_name: string | null;
  sender_email: string | null;
  recipient_name: string | null;
  recipient_email: string | null;
  message: string | null;
  status: string;
  purchase_method: string;
  expires_at: string | null;
  created_at: string;
  redeemed_at: string | null;
}

interface SubscriptionType {
  id: string;
  name: string;
  price: number;
}

export const GiftCardManagement: React.FC = () => {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null);
  const [pdfCard, setPdfCard] = useState<GiftCard | null>(null);

  // Form state
  const [cardType, setCardType] = useState<'amount' | 'subscription'>('amount');
  const [amount, setAmount] = useState('');
  const [subscriptionTypeId, setSubscriptionTypeId] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [expiryMonths, setExpiryMonths] = useState('12');

  useEffect(() => {
    fetchGiftCards();
    fetchSubscriptionTypes();
  }, []);

  const fetchGiftCards = async () => {
    try {
      const { data, error } = await supabase
        .from('gift_cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGiftCards(data || []);
    } catch (error) {
      console.error('Error fetching gift cards:', error);
      toast.error('Σφάλμα φόρτωσης gift cards');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_types')
        .select('id, name, price')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setSubscriptionTypes(data || []);
    } catch (error) {
      console.error('Error fetching subscription types:', error);
    }
  };

  const generateCode = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_gift_card_code');
    if (error) throw error;
    return data;
  };

  const handleCreate = async () => {
    try {
      const code = await generateCode();
      
      const { data: currentUser } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + parseInt(expiryMonths));

      const newCard: any = {
        code,
        card_type: cardType,
        sender_name: senderName || null,
        sender_email: senderEmail || null,
        recipient_name: recipientName || null,
        recipient_email: recipientEmail || null,
        message: message || null,
        status: 'active',
        purchase_method: 'manual',
        created_by: currentUser?.id,
        expires_at: expiresAt.toISOString(),
      };

      if (cardType === 'amount') {
        newCard.amount = parseFloat(amount);
      } else {
        newCard.subscription_type_id = subscriptionTypeId;
        const sub = subscriptionTypes.find(s => s.id === subscriptionTypeId);
        if (sub) newCard.amount = sub.price;
      }

      const { data, error } = await supabase
        .from('gift_cards')
        .insert(newCard)
        .select()
        .single();

      if (error) throw error;

      toast.success(`Gift Card δημιουργήθηκε: ${code}`);
      setCreateOpen(false);
      resetForm();
      fetchGiftCards();

      // Show PDF dialog
      if (data) setPdfCard(data);
    } catch (error) {
      console.error('Error creating gift card:', error);
      toast.error('Σφάλμα δημιουργίας gift card');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const { error } = await supabase
        .from('gift_cards')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;
      toast.success('Gift Card ακυρώθηκε');
      fetchGiftCards();
    } catch (error) {
      console.error('Error cancelling gift card:', error);
      toast.error('Σφάλμα ακύρωσης');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Κωδικός αντιγράφηκε');
  };

  const resetForm = () => {
    setCardType('amount');
    setAmount('');
    setSubscriptionTypeId('');
    setSenderName('');
    setSenderEmail('');
    setRecipientName('');
    setRecipientEmail('');
    setMessage('');
    setExpiryMonths('12');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      redeemed: 'bg-blue-100 text-blue-800',
      expired: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      active: 'Ενεργό',
      redeemed: 'Εξαργυρώθηκε',
      expired: 'Έληξε',
      cancelled: 'Ακυρωμένο',
    };
    return <Badge className={`rounded-none ${variants[status] || ''}`}>{labels[status] || status}</Badge>;
  };

  const filtered = giftCards.filter(gc =>
    gc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gc.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gc.recipient_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="h-6 w-6" />
            Gift Cards
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Διαχείριση δωροκαρτών
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black text-white hover:bg-gray-800 rounded-none">
              <Plus className="h-4 w-4 mr-2" />
              Νέο Gift Card
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg rounded-none">
            <DialogHeader>
              <DialogTitle>Δημιουργία Gift Card</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Τύπος</Label>
                <Select value={cardType} onValueChange={(v: 'amount' | 'subscription') => setCardType(v)}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amount">Χρηματικό ποσό</SelectItem>
                    <SelectItem value="subscription">Συνδρομή</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {cardType === 'amount' ? (
                <div>
                  <Label>Ποσό (€)</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="50"
                    className="rounded-none"
                  />
                </div>
              ) : (
                <div>
                  <Label>Συνδρομή</Label>
                  <Select value={subscriptionTypeId} onValueChange={setSubscriptionTypeId}>
                    <SelectTrigger className="rounded-none">
                      <SelectValue placeholder="Επιλέξτε συνδρομή" />
                    </SelectTrigger>
                    <SelectContent>
                      {subscriptionTypes.map(st => (
                        <SelectItem key={st.id} value={st.id}>
                          {st.name} - €{st.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Όνομα αποστολέα</Label>
                  <Input value={senderName} onChange={e => setSenderName(e.target.value)} className="rounded-none" />
                </div>
                <div>
                  <Label>Email αποστολέα</Label>
                  <Input value={senderEmail} onChange={e => setSenderEmail(e.target.value)} className="rounded-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Όνομα παραλήπτη</Label>
                  <Input value={recipientName} onChange={e => setRecipientName(e.target.value)} className="rounded-none" />
                </div>
                <div>
                  <Label>Email παραλήπτη</Label>
                  <Input value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} className="rounded-none" />
                </div>
              </div>

              <div>
                <Label>Μήνυμα</Label>
                <Textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Χρόνια πολλά! 🎉"
                  className="rounded-none"
                />
              </div>

              <div>
                <Label>Λήξη σε (μήνες)</Label>
                <Select value={expiryMonths} onValueChange={setExpiryMonths}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 μήνες</SelectItem>
                    <SelectItem value="6">6 μήνες</SelectItem>
                    <SelectItem value="12">12 μήνες</SelectItem>
                    <SelectItem value="24">24 μήνες</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleCreate} className="w-full bg-black text-white hover:bg-gray-800 rounded-none">
                Δημιουργία Gift Card
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Αναζήτηση κωδικού, ονόματος, email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10 rounded-none"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Σύνολο', value: giftCards.length, color: 'text-gray-900' },
          { label: 'Ενεργά', value: giftCards.filter(g => g.status === 'active').length, color: 'text-green-600' },
          { label: 'Εξαργυρωμένα', value: giftCards.filter(g => g.status === 'redeemed').length, color: 'text-blue-600' },
          { label: 'Συνολική αξία', value: `€${giftCards.filter(g => g.status === 'active').reduce((sum, g) => sum + (g.amount || 0), 0).toFixed(0)}`, color: 'text-[#cb8954]' },
        ].map((stat, i) => (
          <Card key={i} className="rounded-none">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="rounded-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Κωδικός</TableHead>
                <TableHead>Τύπος</TableHead>
                <TableHead>Αξία</TableHead>
                <TableHead>Παραλήπτης</TableHead>
                <TableHead>Κατάσταση</TableHead>
                <TableHead>Ημ/νία</TableHead>
                <TableHead>Ενέργειες</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(gc => (
                <TableRow key={gc.id}>
                  <TableCell>
                    <button onClick={() => copyCode(gc.code)} className="flex items-center gap-1 font-mono text-sm hover:text-[#00ffba]">
                      {gc.code}
                      <Copy className="h-3 w-3" />
                    </button>
                  </TableCell>
                  <TableCell>{gc.card_type === 'amount' ? 'Ποσό' : 'Συνδρομή'}</TableCell>
                  <TableCell>€{gc.amount || 0}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{gc.recipient_name || '-'}</div>
                      <div className="text-muted-foreground text-xs">{gc.recipient_email || ''}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(gc.status)}</TableCell>
                  <TableCell className="text-sm">{format(new Date(gc.created_at), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setPdfCard(gc)} title="PDF">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {gc.status === 'active' && (
                        <Button variant="ghost" size="sm" onClick={() => handleCancel(gc.id)} title="Ακύρωση">
                          <Ban className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Δεν βρέθηκαν gift cards
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* PDF Preview Dialog */}
      {pdfCard && (
        <GiftCardPDFDialog
          giftCard={pdfCard}
          isOpen={!!pdfCard}
          onClose={() => setPdfCard(null)}
        />
      )}
    </div>
  );
};
