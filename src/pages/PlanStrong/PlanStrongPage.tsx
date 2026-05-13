import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Save, Send, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { UserSearchCombobox } from '@/components/users/UserSearchCombobox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Worksheet1Side } from './Worksheet1';
import { Worksheet2 } from './Worksheet2';
import { defaultPlanStrongData, PlanStrongData } from './planStrongCalc';

export default function PlanStrongPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get('id');
  const { user } = useAuth();
  const { isAdmin } = useRoleCheck();
  const [name, setName] = useState('Plan Strong Draft');
  const [userId, setUserId] = useState<string>('');
  const [userIds, setUserIds] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Array<{ id: string; name: string; email: string; avatar_url: string | null; photo_url: string | null }>>([]);
  const [pickerValue, setPickerValue] = useState<string>('');
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
        setUserIds([row.user_id]);
        const def = defaultPlanStrongData();
        const loaded = (row.data as any) || {};
        setData({
          ...def,
          ...loaded,
          side: loaded.side ?? loaded.left ?? def.side,
          sessions: loaded.sessions ?? loaded.sessionsLeft ?? def.sessions,
        });
      }
    })();
  }, [editId]);

  // Fetch profile data for chip display
  useEffect(() => {
    (async () => {
      if (userIds.length === 0) { setSelectedUsers([]); return; }
      const { data } = await supabase
        .from('app_users')
        .select('id, name, email, avatar_url, photo_url')
        .in('id', userIds);
      setSelectedUsers(data || []);
    })();
  }, [userIds]);

  const addUser = (uid: string | null) => {
    if (!uid) return;
    setUserIds(prev => prev.includes(uid) ? prev : [...prev, uid]);
    setPickerValue('');
  };
  const removeUser = (uid: string) => {
    setUserIds(prev => prev.filter(id => id !== uid));
  };

  const save = async (status: 'draft' | 'assigned') => {
    if (userIds.length === 0) { toast.error('Επίλεξε τουλάχιστον έναν χρήστη'); return; }
    setSaving(true);
    if (draftId) {
      // Edit mode — single record update
      const payload = {
        name, user_id: userIds[0], status,
        coach_id: user?.id, created_by: user?.id,
        data: data as any,
      };
      const { error } = await supabase.from('plan_strong_drafts').update(payload).eq('id', draftId);
      setSaving(false);
      if (error) { toast.error(error.message); return; }
      toast.success(status === 'draft' ? 'Αποθηκεύτηκε' : 'Ανατέθηκε');
      return;
    }
    // New — one row per user
    const rows = userIds.map(uid => ({
      name, user_id: uid, status,
      coach_id: user?.id, created_by: user?.id,
      data: data as any,
    }));
    const { data: inserted, error } = await supabase.from('plan_strong_drafts').insert(rows).select();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    if (inserted && inserted.length === 1) setDraftId(inserted[0].id);
    toast.success(status === 'draft'
      ? `Αποθηκεύτηκαν ${rows.length} πρόχειρα`
      : `Ανατέθηκε σε ${rows.length} χρήστες`);
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
          <Label className="text-xs">Χρήστες</Label>
          <UserSearchCombobox
            value={pickerValue}
            onValueChange={addUser}
            placeholder={draftId ? "Επεξεργασία υπάρχοντος (1 χρήστης)" : "Προσθήκη χρήστη..."}
            coachId={user?.id}
            adminOwned={isAdmin?.()}
            disabled={!!draftId}
          />
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedUsers.map(u => (
                <Badge key={u.id} variant="outline" className="rounded-none gap-2 py-1 pr-1 pl-1">
                  <Avatar className="h-5 w-5">
                    {(u.photo_url || u.avatar_url) ? (
                      <AvatarImage src={u.photo_url || u.avatar_url || ''} alt={u.name} />
                    ) : null}
                    <AvatarFallback className="text-[10px] bg-muted">
                      {u.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs">{u.name}</span>
                  {!draftId && (
                    <button
                      type="button"
                      onClick={() => removeUser(u.id)}
                      className="ml-1 hover:text-destructive"
                      title="Αφαίρεση"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="ws1" className="w-full">
        <TabsList className="rounded-none">
          <TabsTrigger className="rounded-none" value="ws1">WORKSHEET #1</TabsTrigger>
          <TabsTrigger className="rounded-none" value="ws2">WORKSHEET #2</TabsTrigger>
          <TabsTrigger className="rounded-none" value="ws3">WORKSHEET #3</TabsTrigger>
        </TabsList>

        <TabsContent value="ws1" className="space-y-3">
          <Worksheet1Side side={data.side} userId={userIds[0] || userId} onChange={s => setData({ ...data, side: s })} />
        </TabsContent>

        <TabsContent value="ws2" className="space-y-3">
          <Worksheet2 title={`PS ${data.side.ps}`} weeks={data.sessions}
            onChange={w => setData({ ...data, sessions: w })} />
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
