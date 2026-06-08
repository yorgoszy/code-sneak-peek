import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Save, Send, X, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { UserSearchCombobox } from '@/components/users/UserSearchCombobox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Worksheet1Side } from './Worksheet1';
import { Worksheet2 } from './Worksheet2';
import { defaultPlanStrongData, defaultSide, PlanStrongData, PlanStrongSideInput, computeWeekDifficulties } from './planStrongCalc';
import { SimpleExerciseSelectionDialog } from '@/components/programs/builder/SimpleExerciseSelectionDialog';
import { useExercises } from '@/hooks/useExercises';

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
  const [previewUserId, setPreviewUserId] = useState<string>('');
  const [data, setData] = useState<PlanStrongData>(defaultPlanStrongData());
  const [saving, setSaving] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(editId);
  // Map of userId -> draftId for sibling drafts that belong to the same plan
  // (same coach_id + name). Lets us update/insert/delete per user on save.
  const [draftIdByUser, setDraftIdByUser] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!editId) return;
    (async () => {
      const { data: row } = await supabase
        .from('plan_strong_drafts').select('*').eq('id', editId).maybeSingle();
      if (!row) return;
      setName(row.name);
      const def = defaultPlanStrongData();
      const loaded = (row.data as any) || {};
      const activeSide = loaded.side ?? loaded.left ?? def.side;
      const loadedSides: any[] = Array.isArray(loaded.sides) && loaded.sides.length > 0
        ? loaded.sides
        : [activeSide];
      const activeIdx = typeof loaded.activeSideIndex === 'number'
        ? Math.min(Math.max(loaded.activeSideIndex, 0), loadedSides.length - 1)
        : 0;
      setData({
        ...def,
        ...loaded,
        side: loadedSides[activeIdx] ?? activeSide,
        sides: loadedSides,
        activeSideIndex: activeIdx,
        sessions: loaded.sessions ?? loaded.sessionsLeft ?? def.sessions,
      });
      // Load all sibling drafts (same coach + same plan name) so the user
      // can add/remove athletes from this plan.
      const { data: siblings } = await supabase
        .from('plan_strong_drafts')
        .select('id, user_id')
        .eq('coach_id', row.coach_id)
        .eq('name', row.name);
      const list = siblings && siblings.length > 0 ? siblings : [{ id: row.id, user_id: row.user_id }];
      const map: Record<string, string> = {};
      list.forEach((s: any) => { map[s.user_id] = s.id; });
      setDraftIdByUser(map);
      setUserId(row.user_id);
      setUserIds(list.map((s: any) => s.user_id));
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
      setPreviewUserId(prev => (prev && userIds.includes(prev)) ? prev : (userIds[0] || ''));
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
    const weekDifficulties = computeWeekDifficulties(data.side.mainPct || []);
    const dataToSave: any = { ...data, weekDifficulties };

    if (draftId) {
      // EDIT mode — sync sibling drafts (one per user) against current selection
      const updates: any[] = [];
      const toInsert: any[] = [];
      const newMap: Record<string, string> = {};

      userIds.forEach(uid => {
        const existingId = draftIdByUser[uid];
        if (existingId) {
          newMap[uid] = existingId;
          updates.push(
            supabase.from('plan_strong_drafts').update({
              name, user_id: uid, status,
              coach_id: user?.id, created_by: user?.id,
              data: dataToSave,
            }).eq('id', existingId)
          );
        } else {
          toInsert.push({
            name, user_id: uid, status,
            coach_id: user?.id, created_by: user?.id,
            data: dataToSave,
          });
        }
      });

      // Removed users → delete their sibling rows
      const removedIds = Object.entries(draftIdByUser)
        .filter(([uid]) => !userIds.includes(uid))
        .map(([, id]) => id);

      const ops: any[] = [...updates];
      if (toInsert.length > 0) {
        ops.push(
          supabase.from('plan_strong_drafts').insert(toInsert).select().then((res: any) => {
            (res.data || []).forEach((r: any) => { newMap[r.user_id] = r.id; });
            return res;
          })
        );
      }
      if (removedIds.length > 0) {
        ops.push(supabase.from('plan_strong_drafts').delete().in('id', removedIds));
      }

      const results = await Promise.all(ops);
      setSaving(false);
      const firstError = results.find((r: any) => r?.error)?.error;
      if (firstError) { toast.error(firstError.message); return; }
      setDraftIdByUser(newMap);
      // Keep primary draftId pointing to a still-existing row
      if (!userIds.includes(userId) || !newMap[userId]) {
        const firstUid = userIds[0];
        setUserId(firstUid);
        if (newMap[firstUid]) setDraftId(newMap[firstUid]);
      }
      toast.success(status === 'draft'
        ? `Αποθηκεύτηκαν ${userIds.length} πρόχειρα`
        : `Ανατέθηκε σε ${userIds.length} χρήστες`);
      return;
    }

    // NEW — one row per user
    const rows = userIds.map(uid => ({
      name, user_id: uid, status,
      coach_id: user?.id, created_by: user?.id,
      data: dataToSave,
    }));
    const { data: inserted, error } = await supabase.from('plan_strong_drafts').insert(rows).select();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    if (inserted && inserted.length > 0) {
      const map: Record<string, string> = {};
      inserted.forEach((r: any) => { map[r.user_id] = r.id; });
      setDraftIdByUser(map);
      setDraftId(inserted[0].id);
      setUserId(inserted[0].user_id);
    }
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

      <div className="border border-border p-3">
        <Label className="text-xs">Όνομα Πλάνου</Label>
        <Input className="rounded-none" value={name} onChange={e => setName(e.target.value)} />
      </div>


      <Tabs defaultValue="ws1" className="w-full">
        <TabsList className="rounded-none">
          <TabsTrigger className="rounded-none" value="ws1">WORKSHEET #1</TabsTrigger>
          <TabsTrigger className="rounded-none" value="ws2">WORKSHEET #2</TabsTrigger>
          <TabsTrigger className="rounded-none" value="ws3">WORKSHEET #3</TabsTrigger>
        </TabsList>

        <TabsContent value="ws1" className="space-y-3">
          {selectedUsers.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap border border-border p-2">
              <span className="text-xs text-muted-foreground mr-1">Προβολή 1RM για:</span>
              {selectedUsers.map(u => {
                const active = previewUserId === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setPreviewUserId(u.id)}
                    className={`flex items-center gap-2 px-2 py-1 border ${active ? 'border-foreground bg-foreground text-background' : 'border-border'} rounded-none`}
                  >
                    <Avatar className="h-5 w-5">
                      {(u.photo_url || u.avatar_url) ? (
                        <AvatarImage src={u.photo_url || u.avatar_url || ''} alt={u.name} />
                      ) : null}
                      <AvatarFallback className="text-[10px] bg-muted text-foreground">
                        {u.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{u.name}</span>
                  </button>
                );
              })}
            </div>
          )}
          <Worksheet1Side
            side={data.side}
            userId={previewUserId || userIds[0] || userId}
            onChange={s => setData({ ...data, side: s })}
            userPickerSlot={
              <div className="space-y-2">
                <UserSearchCombobox
                  value={pickerValue}
                  onValueChange={addUser}
                  placeholder="Προσθήκη χρήστη..."
                  coachId={user?.id}
                  adminOwned={isAdmin?.()}
                  triggerClassName="h-7 justify-start text-xs px-2"
                />
                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedUsers.map(u => (
                      <Badge key={u.id} variant="outline" className="rounded-none gap-1 py-0.5 pr-1 pl-0.5 text-xs">
                        <Avatar className="h-4 w-4">
                          {(u.photo_url || u.avatar_url) ? (
                            <AvatarImage src={u.photo_url || u.avatar_url || ''} alt={u.name} />
                          ) : null}
                          <AvatarFallback className="text-[8px] bg-muted">
                            {u.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{u.name}</span>
                        <button
                          type="button"
                          onClick={() => removeUser(u.id)}
                          className="ml-0.5 hover:text-destructive"
                          title="Αφαίρεση"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            }
          />

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
