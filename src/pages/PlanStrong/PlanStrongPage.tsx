import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Save, Send, X, Plus, Copy, ClipboardPaste } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { UserSearchCombobox } from '@/components/users/UserSearchCombobox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Worksheet1Side } from './Worksheet1';
import { UserExerciseDataCacheProvider } from '@/hooks/useUserExerciseDataCache';
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
      const usersById = new Map((data || []).map((u: any) => [u.id, u]));
      setSelectedUsers(userIds.map(id => usersById.get(id)).filter(Boolean) as any);
      setPreviewUserId(prev => (prev && userIds.includes(prev)) ? prev : (userIds[0] || ''));
    })();
  }, [userIds]);

  // ---- Exercise tabs (multiple exercises per worksheet) ----
  const sides: PlanStrongSideInput[] = (data.sides && data.sides.length > 0) ? data.sides : [data.side];
  const activeIdx = Math.min(Math.max(data.activeSideIndex ?? 0, 0), sides.length - 1);
  const activeSide = sides[activeIdx] || data.side;
  const [exPickerOpen, setExPickerOpen] = useState(false);
  const { exercises } = useExercises();

  const updateActiveSide = (next: PlanStrongSideInput) => {
    const nextSides = sides.map((s, i) => i === activeIdx ? next : s);
    setData({ ...data, sides: nextSides, side: next, activeSideIndex: activeIdx });
  };
  const selectTab = (i: number) => {
    setData({ ...data, sides, side: sides[i], activeSideIndex: i });
  };
  const addExerciseTab = (exId: string) => {
    const ex = exercises.find((e: any) => e.id === exId);
    const fresh = defaultSide();
    const newSide: PlanStrongSideInput = ex
      ? { ...fresh, exerciseId: ex.id, lift: ex.name }
      : fresh;
    const nextSides = [...sides, newSide];
    setData({ ...data, sides: nextSides, side: newSide, activeSideIndex: nextSides.length - 1 });
    setExPickerOpen(false);
  };
  const removeExerciseTab = (i: number) => {
    if (sides.length <= 1) return;
    const nextSides = sides.filter((_, idx) => idx !== i);
    const nextIdx = Math.max(0, Math.min(activeIdx, nextSides.length - 1));
    setData({ ...data, sides: nextSides, side: nextSides[nextIdx], activeSideIndex: nextIdx });
  };

  // Clipboard για copy/paste worksheet μεταξύ ασκήσεων
  const [sideClipboard, setSideClipboard] = useState<PlanStrongSideInput | null>(null);
  const copyActiveSide = () => {
    setSideClipboard(JSON.parse(JSON.stringify(activeSide)));
    toast.success(`Αντιγράφηκε: ${activeSide.lift || 'άσκηση'}`);
  };
  const pasteIntoActiveSide = () => {
    if (!sideClipboard) { toast.error('Δεν υπάρχει αντιγραμμένο worksheet'); return; }
    // Διατηρούμε την ταυτότητα της τρέχουσας άσκησης (lift + exerciseId + oneRM)
    const next: PlanStrongSideInput = {
      ...sideClipboard,
      lift: activeSide.lift,
      exerciseId: activeSide.exerciseId,
      oneRM: activeSide.oneRM,
    };
    updateActiveSide(next);
    toast.success('Επικολλήθηκε worksheet');
  };




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
          {/* Exercise tabs */}
          <div className="flex items-center gap-1 flex-wrap border-b border-border">
            {sides.map((s, i) => {
              const active = i === activeIdx;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-1 px-2 py-1 border border-b-0 ${active ? 'bg-foreground text-background border-foreground' : 'bg-background border-border'} rounded-none cursor-pointer`}
                  onClick={() => selectTab(i)}
                >
                  <span className="text-xs font-semibold">{s.lift || `Άσκηση ${i + 1}`}</span>
                  {sides.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeExerciseTab(i); }}
                      className="ml-1 hover:text-destructive"
                      title="Αφαίρεση άσκησης"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
            <Button
              type="button" variant="outline" size="sm"
              className="h-7 rounded-none ml-1"
              onClick={() => setExPickerOpen(true)}
            >
              <Plus className="w-3 h-3 mr-1" /> Άσκηση
            </Button>
          </div>

          {/* User tabs */}
          <div className="flex items-center gap-1 flex-wrap border-b border-border">
            {selectedUsers.map(u => {
              const active = previewUserId === u.id;
              return (
                <div
                  key={u.id}
                  className={`flex items-center gap-1 px-2 py-1 border border-b-0 ${active ? 'bg-foreground text-background border-foreground' : 'bg-background border-border'} rounded-none cursor-pointer`}
                  onClick={() => setPreviewUserId(u.id)}
                >
                  <Avatar className="h-5 w-5">
                    {(u.photo_url || u.avatar_url) ? (
                      <AvatarImage src={u.photo_url || u.avatar_url || ''} alt={u.name} />
                    ) : null}
                    <AvatarFallback className={`text-[10px] ${active ? 'bg-background text-foreground' : 'bg-muted text-foreground'}`}>
                      {u.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs">{u.name}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeUser(u.id); }}
                    className="ml-1 hover:text-destructive"
                    title="Αφαίρεση χρήστη"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
            <div className="ml-1 min-w-[180px]">
              <UserSearchCombobox
                value={pickerValue}
                onValueChange={addUser}
                placeholder="+ Χρήστης"
                coachId={user?.id}
                adminOwned={isAdmin?.()}
                triggerClassName="h-7 justify-start text-xs px-2"
              />
            </div>
          </div>

          <UserExerciseDataCacheProvider userId={previewUserId || userIds[0] || userId || null}>
            <Worksheet1Side
              side={activeSide}
              userId={previewUserId || userIds[0] || userId}
              onChange={updateActiveSide}
              nlActionsSlot={
                <>
                  <button
                    type="button"
                    onClick={copyActiveSide}
                    className="h-7 px-2 hover:bg-muted rounded-none border border-border inline-flex items-center"
                    title="Αντιγραφή worksheet"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={pasteIntoActiveSide}
                    disabled={!sideClipboard}
                    className={`h-7 px-2 rounded-none border inline-flex items-center disabled:opacity-30 disabled:cursor-not-allowed ${sideClipboard ? 'bg-[#00ffba] hover:bg-[#00ffba]/90 text-black border-[#00ffba]' : 'hover:bg-muted border-border'}`}
                    title={sideClipboard ? 'Επικόλληση worksheet' : 'Δεν υπάρχει αντιγραμμένο worksheet'}
                  >
                    <ClipboardPaste className="w-3 h-3" />
                  </button>
                </>
              }
            />
          </UserExerciseDataCacheProvider>


        </TabsContent>

        <TabsContent value="ws2" className="space-y-3">
          <Worksheet2 title={`PS ${activeSide.ps}`} weeks={data.sessions}
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

      <SimpleExerciseSelectionDialog
        open={exPickerOpen}
        onOpenChange={setExPickerOpen}
        exercises={exercises as any}
        onSelectExercise={addExerciseTab}
      />

    </div>
  );
}
