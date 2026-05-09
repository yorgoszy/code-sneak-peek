import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserSearchCombobox } from '@/components/users/UserSearchCombobox';
import { Worksheet1Side } from './Worksheet1';
import { Worksheet2 } from './Worksheet2';
import { defaultPlanStrongData, PlanStrongData } from './planStrongCalc';

export default function PlanStrongPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get('id');
  const { user } = useAuth();
  const [name, setName] = useState('Plan Strong Draft');
  const [userId, setUserId] = useState<string>('');
  const [data, setData] = useState<PlanStrongData>(defaultPlanStrongData());
  const [saving, setSaving] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(editId);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      const { data: row } = await supabase
        .from('plan_strong_drafts').select('*').eq('id', editId).maybeSingle();
      if (row) {
        setName(row.name);
        setUserId(row.user_id);
        setData({ ...defaultPlanStrongData(), ...(row.data as any) });
      }
    })();
  }, [editId]);

  const save = async (status: 'draft' | 'assigned') => {
    if (!userId) { toast.error('Επίλεξε χρήστη'); return; }
    setSaving(true);
    const payload = {
      name, user_id: userId, status,
      coach_id: user?.id, created_by: user?.id,
      data: data as any,
    };
    const q = draftId
      ? supabase.from('plan_strong_drafts').update(payload).eq('id', draftId).select().single()
      : supabase.from('plan_strong_drafts').insert(payload).select().single();
    const { data: row, error } = await q;
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setDraftId(row.id);
    toast.success(status === 'draft' ? 'Αποθηκεύτηκε ως πρόχειρο' : 'Ανατέθηκε στον χρήστη');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-none" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Πίσω
          </Button>
          <h1 className="text-xl md:text-2xl font-bold">Plan Strong / Build Strong</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-none" disabled={saving} onClick={() => save('draft')}>
            <Save className="w-4 h-4 mr-1" /> Αποθήκευση Προχείρου
          </Button>
          <Button className="rounded-none" disabled={saving} onClick={() => save('assigned')}>
            <Send className="w-4 h-4 mr-1" /> Ανάθεση
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border border-border p-3">
        <div>
          <Label className="text-xs">Όνομα Πλάνου</Label>
          <Input className="rounded-none" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Χρήστης</Label>
          <UserSearchCombobox
            value={userId}
            onValueChange={(v) => setUserId(v || '')}
            placeholder="Επιλέξτε χρήστη..."
            coachId={user?.id}
          />
        </div>
      </div>

      <Tabs defaultValue="ws1" className="w-full">
        <TabsList className="rounded-none">
          <TabsTrigger className="rounded-none" value="ws1">WORKSHEET #1</TabsTrigger>
          <TabsTrigger className="rounded-none" value="ws2">WORKSHEET #2</TabsTrigger>
          <TabsTrigger className="rounded-none" value="ws3">WORKSHEET #3</TabsTrigger>
        </TabsList>

        <TabsContent value="ws1" className="space-y-3">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <Worksheet1Side title="PS 50" side={data.left} onChange={s => setData({ ...data, left: s })} />
            <Worksheet1Side title="PS 70" side={data.right} onChange={s => setData({ ...data, right: s })} />
          </div>
        </TabsContent>

        <TabsContent value="ws2" className="space-y-3">
          <Worksheet2 title="PS 50" weeks={data.sessionsLeft}
            onChange={w => setData({ ...data, sessionsLeft: w })} />
          <Worksheet2 title="PS 70" weeks={data.sessionsRight}
            onChange={w => setData({ ...data, sessionsRight: w })} />
        </TabsContent>

        <TabsContent value="ws3">
          <div className="border border-border">
            <div className="bg-foreground text-background px-3 py-2 text-sm font-bold flex justify-between">
              <span>PLAN STRONG™ — Notes</span>
              <span>WORKSHEET #3</span>
            </div>
            <div className="p-3">
              <Label className="text-xs">Σημειώσεις / Build Strong παρατηρήσεις</Label>
              <Textarea rows={20} className="rounded-none mt-1"
                value={data.ws3Notes}
                onChange={e => setData({ ...data, ws3Notes: e.target.value })} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
