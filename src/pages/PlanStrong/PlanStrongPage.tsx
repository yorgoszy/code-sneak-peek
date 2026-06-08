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
import { defaultPlanStrongData, defaultSide, PlanStrongData, PlanStrongSideInput, computeWeekDifficulties, computeSide, PlanStrongMonthWS2, defaultMonthWS2 } from './planStrongCalc';
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
      const loadedMonths: any[] = Array.isArray(loaded.months) && loaded.months.length > 0
        ? loaded.months.map((m: any) => ({
            sides: Array.isArray(m?.sides) && m.sides.length > 0 ? m.sides : [activeSide],
            activeSideIndex: typeof m?.activeSideIndex === 'number' ? m.activeSideIndex : 0,
          }))
        : [{ sides: loadedSides, activeSideIndex: activeIdx }];
      setData({
        ...def,
        ...loaded,
        side: loadedSides[activeIdx] ?? activeSide,
        sides: loadedSides,
        activeSideIndex: activeIdx,
        months: loadedMonths,
        sessions: loaded.sessions ?? loaded.sessionsLeft ?? def.sessions,
      } as any);
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

  // ---- Months (each month = independent Worksheet #1, stacked vertically) ----
  type MonthState = { sides: PlanStrongSideInput[]; activeSideIndex: number };
  const monthsList: MonthState[] = ((data as any).months && (data as any).months.length > 0)
    ? (data as any).months as MonthState[]
    : [{ sides: (data.sides && data.sides.length > 0) ? data.sides : [data.side], activeSideIndex: data.activeSideIndex ?? 0 }];

  const [exPickerForMonth, setExPickerForMonth] = useState<number | null>(null);
  const [activeMonthIdx, setActiveMonthIdx] = useState<number>(0);
  const { exercises } = useExercises();

  const writeMonths = (nextMonths: MonthState[]) => {
    const safeIdx = Math.max(0, Math.min(monthsList[0] ? 0 : 0, nextMonths.length - 1));
    const first = nextMonths[0];
    setData({
      ...data,
      months: nextMonths,
      // Keep legacy fields aligned to first month for back-compat (Worksheet2 uses data.side.ps)
      sides: first?.sides ?? [],
      side: first?.sides?.[first.activeSideIndex] || data.side,
      activeSideIndex: first?.activeSideIndex ?? 0,
    } as any);
  };

  const updateMonth = (mIdx: number, next: MonthState) => {
    writeMonths(monthsList.map((m, i) => i === mIdx ? next : m));
  };
  const updateMonthSide = (mIdx: number, sIdx: number, next: PlanStrongSideInput) => {
    const m = monthsList[mIdx];
    if (!m) return;
    const nextSides = m.sides.map((s, i) => i === sIdx ? next : s);
    updateMonth(mIdx, { sides: nextSides, activeSideIndex: sIdx });
  };
  const selectMonthSideTab = (mIdx: number, sIdx: number) => {
    const m = monthsList[mIdx];
    if (!m) return;
    updateMonth(mIdx, { sides: m.sides, activeSideIndex: sIdx });
  };
  const addMonthExercise = (mIdx: number, exId: string) => {
    const m = monthsList[mIdx];
    if (!m) return;
    const ex = exercises.find((e: any) => e.id === exId);
    const fresh = defaultSide();
    const newSide: PlanStrongSideInput = ex ? { ...fresh, exerciseId: ex.id, lift: ex.name } : fresh;
    const nextSides = [...m.sides, newSide];
    updateMonth(mIdx, { sides: nextSides, activeSideIndex: nextSides.length - 1 });
    setExPickerForMonth(null);
  };
  const removeMonthExercise = (mIdx: number, sIdx: number) => {
    const m = monthsList[mIdx];
    if (!m || m.sides.length <= 1) return;
    const nextSides = m.sides.filter((_, i) => i !== sIdx);
    const nextIdx = Math.max(0, Math.min(m.activeSideIndex, nextSides.length - 1));
    updateMonth(mIdx, { sides: nextSides, activeSideIndex: nextIdx });
  };

  const addMonth = () => {
    const fresh: MonthState = { sides: [defaultSide()], activeSideIndex: 0 };
    const nextMonths = [...monthsList, fresh];
    writeMonths(nextMonths);
    setActiveMonthIdx(nextMonths.length - 1);
  };
  const removeMonth = (mIdx: number) => {
    if (monthsList.length <= 1) return;
    const nextMonths = monthsList.filter((_, i) => i !== mIdx);
    writeMonths(nextMonths);
    setActiveMonthIdx(prev => Math.max(0, Math.min(prev > mIdx ? prev - 1 : prev, nextMonths.length - 1)));
  };

  // Clipboard για copy/paste worksheet μεταξύ ασκήσεων (διαμοιραζόμενο)
  const [sideClipboard, setSideClipboard] = useState<PlanStrongSideInput | null>(null);
  const copySide = (s: PlanStrongSideInput) => {
    setSideClipboard(JSON.parse(JSON.stringify(s)));
    toast.success(`Αντιγράφηκε: ${s.lift || 'άσκηση'}`);
  };
  const pasteIntoMonthSide = (mIdx: number, sIdx: number) => {
    if (!sideClipboard) { toast.error('Δεν υπάρχει αντιγραμμένο worksheet'); return; }
    const m = monthsList[mIdx];
    const current = m?.sides[sIdx];
    if (!current) return;
    const next: PlanStrongSideInput = {
      ...sideClipboard,
      lift: current.lift,
      exerciseId: current.exerciseId,
      oneRM: current.oneRM,
    };
    updateMonthSide(mIdx, sIdx, next);
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

        <TabsContent value="ws1" className="space-y-6">
          {/* User tabs (κοινό για όλους τους μήνες) */}
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
            {(() => {
              const mIdx = Math.min(Math.max(activeMonthIdx, 0), monthsList.length - 1);
              const m = monthsList[mIdx];
              const mSides = m.sides;
              const mActiveIdx = Math.min(Math.max(m.activeSideIndex ?? 0, 0), mSides.length - 1);
              const mActiveSide = mSides[mActiveIdx] || data.side;

              // Σύγκριση με τον προηγούμενο μήνα (ίδια άσκηση κατά exerciseId ή lift)
              let deltaInfo: React.ReactNode = null;
              if (mIdx > 0) {
                const prevMonth = monthsList[mIdx - 1];
                const prevSide = prevMonth.sides.find(s =>
                  (mActiveSide.exerciseId && s.exerciseId === mActiveSide.exerciseId) ||
                  (mActiveSide.lift && s.lift === mActiveSide.lift)
                );
                if (prevSide) {
                  const cur = computeSide({ ...mActiveSide });
                  const prv = computeSide({ ...prevSide });
                  const curHari = cur.ari * 100;
                  const prvHari = prv.ari * 100;
                  const curNL = Number(mActiveSide.monthlyNL) || 0;
                  const prvNL = Number(prevSide.monthlyNL) || 0;
                  const dHariRel = prvHari > 0 ? ((curHari - prvHari) / prvHari) * 100 : 0;
                  const dNLRel = prvNL > 0 ? ((curNL - prvNL) / prvNL) * 100 : 0;
                  const ps = String(mActiveSide.ps);
                  // Επιτρεπτό εύρος HARI ανά PS
                  const hariOk = ps === '50'
                    ? Math.abs(dHariRel) >= 1 && Math.abs(dHariRel) <= 5
                    : ps === '70'
                      ? Math.abs(dHariRel) >= 0.5 && Math.abs(dHariRel) <= 1.5
                      : true;
                  const nlOk = Math.abs(dNLRel) <= 20;
                  const fmt = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
                  deltaInfo = (
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="opacity-80">vs M{mIdx}:</span>
                      <span className={hariOk ? 'text-[#00ffba]' : 'text-red-400'}>
                        Δ HARI {fmt(dHariRel)}
                      </span>
                      <span className={nlOk ? 'text-[#00ffba]' : 'text-red-400'}>
                        Δ NL {fmt(dNLRel)}
                      </span>
                    </div>
                  );
                }
              }

              return (
                <div key={mIdx} className="space-y-3">
                  {/* Exercise tabs για αυτόν τον μήνα */}
                  <div className="flex items-center gap-1 flex-wrap border-b border-border">
                    {mSides.map((s, i) => {
                      const active = i === mActiveIdx;
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-1 px-2 py-1 border border-b-0 ${active ? 'bg-foreground text-background border-foreground' : 'bg-background border-border'} rounded-none cursor-pointer`}
                          onClick={() => selectMonthSideTab(mIdx, i)}
                        >
                          <span className="text-xs font-semibold">{s.lift || `Άσκηση ${i + 1}`}</span>
                          {mSides.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeMonthExercise(mIdx, i); }}
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
                      onClick={() => setExPickerForMonth(mIdx)}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Άσκηση
                    </Button>
                  </div>

                  <Worksheet1Side
                    side={mActiveSide}
                    userId={previewUserId || userIds[0] || userId}
                    onChange={(next) => updateMonthSide(mIdx, mActiveIdx, next)}
                    prevSide={mIdx > 0 ? (monthsList[mIdx - 1].sides.find(s =>
                      (mActiveSide.exerciseId && s.exerciseId === mActiveSide.exerciseId) ||
                      (mActiveSide.lift && s.lift === mActiveSide.lift)
                    ) || null) : null}
                    headerSlot={
                      <div className="flex items-center gap-2 flex-wrap">
                        {deltaInfo}
                        {/* Month tabs */}
                        <div className="flex items-center gap-1">
                          {monthsList.map((_, i) => {
                            const active = i === mIdx;
                            return (
                              <div
                                key={i}
                                onClick={() => setActiveMonthIdx(i)}
                                className={`flex items-center gap-1 px-2 h-6 border cursor-pointer rounded-none text-xs ${active ? 'bg-background text-foreground border-background' : 'bg-transparent text-background border-background/40 hover:bg-background/10'}`}
                                title={`Μήνας ${i + 1}`}
                              >
                                <span>M{i + 1}</span>
                                {monthsList.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removeMonth(i); }}
                                    className="hover:text-destructive"
                                    title="Αφαίρεση μήνα"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                          <button
                            type="button"
                            onClick={addMonth}
                            className="h-6 w-6 inline-flex items-center justify-center border border-background/40 hover:bg-background/10 rounded-none"
                            title="Προσθήκη μήνα (νέο Worksheet #1)"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    }
                    nlActionsSlot={
                      <>
                        <button
                          type="button"
                          onClick={() => copySide(mActiveSide)}
                          className="h-7 px-2 hover:bg-muted rounded-none border border-border inline-flex items-center"
                          title="Αντιγραφή worksheet"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => pasteIntoMonthSide(mIdx, mActiveIdx)}
                          disabled={!sideClipboard}
                          className={`h-7 px-2 rounded-none border inline-flex items-center disabled:opacity-30 disabled:cursor-not-allowed ${sideClipboard ? 'bg-[#00ffba] hover:bg-[#00ffba]/90 text-black border-[#00ffba]' : 'hover:bg-muted border-border'}`}
                          title={sideClipboard ? 'Επικόλληση worksheet' : 'Δεν υπάρχει αντιγραμμένο worksheet'}
                        >
                          <ClipboardPaste className="w-3 h-3" />
                        </button>
                      </>
                    }
                  />
                </div>
              );
            })()}
          </UserExerciseDataCacheProvider>
        </TabsContent>

        <TabsContent value="ws2" className="space-y-3">
          {(() => {
            // Συγχρονισμός ws2Months με τον αριθμό των μηνών του WS1
            const existing = (data as any).ws2Months as PlanStrongMonthWS2[] | undefined;
            const synced: PlanStrongMonthWS2[] = monthsList.map((_, i) =>
              existing?.[i] ?? defaultMonthWS2()
            );
            const titles = monthsList.map(m => {
              const active = m.sides[Math.min(Math.max(m.activeSideIndex ?? 0, 0), m.sides.length - 1)];
              return `PS ${active?.ps ?? '50'}`;
            });
            return (
              <Worksheet2
                months={synced}
                titles={titles}
                onChange={next => setData({ ...data, ws2Months: next } as any)}
              />
            );
          })()}
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
        open={exPickerForMonth !== null}
        onOpenChange={(open) => { if (!open) setExPickerForMonth(null); }}
        exercises={exercises as any}
        onSelectExercise={(exId) => { if (exPickerForMonth !== null) addMonthExercise(exPickerForMonth, exId); }}
      />


    </div>
  );
}
