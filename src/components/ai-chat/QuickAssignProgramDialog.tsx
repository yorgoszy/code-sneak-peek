import React, { useMemo, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Users, UsersRound, Edit2, Check, Plus, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

// Interface για τα δεδομένα προγράμματος από AI
export interface AIProgramData {
  name: string;
  description?: string;
  training_dates: string[];
  weeks: any[];
  // Για αναθέσεις σε άλλους χρήστες/ομάδες
  user_id?: string;
  user_ids?: string[];
  group_id?: string;
}

type QuickAssignProgramDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  userId: string; // Default user (current user)
  programData?: AIProgramData | null;
};

// Helper για initials
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const QuickAssignProgramDialog: React.FC<QuickAssignProgramDialogProps> = ({
  isOpen,
  onClose,
  userId,
  programData,
}) => {
  const today = new Date().toISOString().split('T')[0];
  
  const [date, setDate] = useState(programData?.training_dates?.[0] || today);
  const [name, setName] = useState(programData?.name || "Πρόγραμμα Προπόνησης");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State για recipients info
  const [recipientUsers, setRecipientUsers] = useState<any[]>([]);
  const [recipientGroup, setRecipientGroup] = useState<any>(null);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  
  // State για user selection
  const [isUserSelectorOpen, setIsUserSelectorOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [loadingAllUsers, setLoadingAllUsers] = useState(false);

  // Υπολογισμός recipient IDs - χρησιμοποιεί local state αν έχει αλλάξει
  const effectiveUserIds = useMemo(() => {
    if (selectedUserIds.length > 0) return selectedUserIds;
    if (programData?.user_ids && programData.user_ids.length > 0) {
      return programData.user_ids;
    }
    if (programData?.user_id) {
      return [programData.user_id];
    }
    return [userId]; // Default to current user
  }, [programData, userId, selectedUserIds]);

  const effectiveGroupId = selectedGroupId !== null ? selectedGroupId : (programData?.group_id || null);

  const recipientFallbackLabel = useMemo(() => {
    const vals = effectiveUserIds
      .map((v) => String(v ?? "").trim())
      .filter(Boolean)
      .map((v) => v.replace(/^['"]|['"]$/g, ""));
    return vals.join(", ");
  }, [effectiveUserIds]);

  // Helper για αναζήτηση χρήστη με όνομα (χωρίς τόνους)
  const normalizeGreek = (str: string): string => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ά/g, 'α').replace(/έ/g, 'ε').replace(/ή/g, 'η')
      .replace(/ί/g, 'ι').replace(/ό/g, 'ο').replace(/ύ/g, 'υ').replace(/ώ/g, 'ω');
  };

  // Fetch recipient details
  useEffect(() => {
    const fetchRecipients = async () => {
      if (!isOpen) return;
      
      setLoadingRecipients(true);
      
      try {
        // Fetch users - first try by ID, then by name/email
        if (effectiveUserIds.length > 0) {
          const isUUID = (str: string) =>
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

          // Sanitize incoming identifiers (uuid/name/email)
          const identifiers = effectiveUserIds
            .map((v) => String(v ?? "").trim())
            .filter(Boolean)
            .map((v) => v.replace(/^['"]|['"]$/g, ""));

          const uuids = identifiers.filter(isUUID);
          const queries = identifiers.filter((id) => !isUUID(id));

          let foundUsers: any[] = [];

          // Fetch by UUID
          if (uuids.length > 0) {
            const { data: users, error } = await supabase
              .from("app_users")
              .select("id, name, email, avatar_url")
              .in("id", uuids);

            if (!error && users) {
              foundUsers = [...foundUsers, ...users];
            }
          }

          // Fetch by name/email (flexible search)
          if (queries.length > 0) {
            const { data: allUsersData } = await supabase
              .from("app_users")
              .select("id, name, email, avatar_url")
              .limit(500);

            if (allUsersData) {
              for (const q of queries) {
                const normalizedSearch = normalizeGreek(q);
                const matched = allUsersData.find((u) => {
                  const normalizedName = normalizeGreek(u.name);
                  const email = String(u.email ?? "").toLowerCase();
                  return (
                    normalizedName.includes(normalizedSearch) ||
                    normalizedSearch.includes(normalizedName) ||
                    normalizedName === normalizedSearch ||
                    email.includes(q.toLowerCase())
                  );
                });

                if (matched && !foundUsers.some((u) => u.id === matched.id)) {
                  foundUsers.push(matched);
                }
              }
            }
          }

          setRecipientUsers(foundUsers);
        }
        
        // Fetch group if exists
        if (effectiveGroupId) {
          const { data: group, error } = await supabase
            .from('groups')
            .select('id, name, description')
            .eq('id', effectiveGroupId)
            .single();
          
          if (!error && group) {
            // Fetch group member count
            const { count } = await supabase
              .from('group_members')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', effectiveGroupId);
            
            setRecipientGroup({ ...group, member_count: count || 0 });
          }
        }
      } catch (err) {
        console.error('Error fetching recipients:', err);
      } finally {
        setLoadingRecipients(false);
      }
    };
    
    fetchRecipients();
  }, [isOpen, effectiveUserIds, effectiveGroupId]);

  // Fetch all users and groups for selection
  useEffect(() => {
    const fetchAllUsersAndGroups = async () => {
      if (!isUserSelectorOpen) return;
      
      setLoadingAllUsers(true);
      try {
        const [usersRes, groupsRes] = await Promise.all([
          supabase.from("app_users").select("id, name, email, avatar_url").order("name").limit(500),
          supabase.from("groups").select("id, name, description").order("name")
        ]);
        
        if (usersRes.data) setAllUsers(usersRes.data);
        if (groupsRes.data) setAllGroups(groupsRes.data);
      } catch (err) {
        console.error("Error fetching users/groups:", err);
      } finally {
        setLoadingAllUsers(false);
      }
    };
    
    fetchAllUsersAndGroups();
  }, [isUserSelectorOpen]);

  // Filtered users based on search
  const filteredUsers = useMemo(() => {
    if (!userSearchTerm.trim()) return allUsers;
    const normalized = normalizeGreek(userSearchTerm);
    return allUsers.filter((u) => {
      const name = normalizeGreek(u.name || "");
      const email = (u.email || "").toLowerCase();
      return name.includes(normalized) || email.includes(userSearchTerm.toLowerCase());
    });
  }, [allUsers, userSearchTerm]);

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    setSelectedGroupId(null); // Clear group when selecting users
    setRecipientGroup(null);
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Select group - fetch members and set
  const selectGroup = async (groupId: string) => {
    setSelectedUserIds([]); // Clear users when selecting group
    setRecipientUsers([]);
    setSelectedGroupId(groupId);
    
    // Fetch group members to get their IDs
    try {
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id, app_users!group_members_user_id_fkey(id, name, email, avatar_url)')
        .eq('group_id', groupId);
      
      if (members && members.length > 0) {
        const memberUserIds = members.map(m => m.user_id).filter(Boolean) as string[];
        setSelectedUserIds(memberUserIds);
        
        // Also set the users for display
        const users = members.map(m => m.app_users).filter(Boolean);
        setRecipientUsers(users);
      }
      
      // Fetch group info for display
      const group = allGroups.find(g => g.id === groupId);
      if (group) {
        setRecipientGroup({ ...group, member_count: members?.length || 0 });
      }
    } catch (err) {
      console.error('Error fetching group members:', err);
    }
    
    setIsUserSelectorOpen(false);
  };

  // Helper για κωδικοποιημένη ονομασία
  const generateCodedName = (description?: string, programName?: string): string => {
    const text = (description || programName || '').toLowerCase();
    const codes: string[] = [];
    
    if (text.includes('strength') || text.includes('δύναμη') || text.includes('δύναμης')) {
      codes.push('STR');
    }
    if (text.includes('endurance') || text.includes('αντοχή') || text.includes('αντοχής')) {
      codes.push('END');
    }
    if (text.includes('power') || text.includes('ισχύς') || text.includes('εκρηκτικ')) {
      codes.push('PWR');
    }
    if (text.includes('hypertrophy') || text.includes('υπερτροφία') || text.includes('μυϊκή')) {
      codes.push('HYP');
    }
    if (text.includes('speed') || text.includes('ταχύτητα')) {
      codes.push('SPD');
    }
    if (text.includes('mobility') || text.includes('κινητικότητα')) {
      codes.push('MOB');
    }
    if (text.includes('core') || text.includes('κορμό') || text.includes('pillar')) {
      codes.push('CORE');
    }
    if (text.includes('conditioning') || text.includes('φυσική κατάσταση')) {
      codes.push('COND');
    }
    
    if (codes.length === 0) {
      codes.push('PROG');
    }
    
    return codes.join('/');
  };

  // Ενημέρωση όταν αλλάζουν τα programData
  useEffect(() => {
    if (programData) {
      const code = generateCodedName(programData.description, programData.name);
      setName(code);
      setDate(programData.training_dates?.[0] || today);
    }
  }, [programData, today]);

  const payload = useMemo(() => {
    // Base payload
    const basePayload: any = {
      action: "create_program" as const,
      name,
      description: programData?.description || "Πρόγραμμα προπόνησης",
      training_dates: [date],
    };

    // Αν υπάρχουν δεδομένα από AI, χρησιμοποίησέ τα
    if (programData?.weeks && programData.weeks.length > 0) {
      basePayload.weeks = programData.weeks;
    } else {
      // Default πρόγραμμα
      basePayload.weeks = [
        {
          name: "Εβδομάδα 1",
          days: [
            {
              name: "Ημέρα 1",
              blocks: [
                {
                  name: "pillar prep",
                  training_type: "pillar prep",
                  exercises: [
                    {
                      exercise_name: "Plank",
                      sets: 3,
                      reps: "30",
                      reps_mode: "time",
                      rest: "30",
                      notes: "Σφιχτός κορμός",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];
    }

    // Set recipients - always use user_ids when we have them (even from group selection)
    if (selectedUserIds.length > 1) {
      basePayload.user_ids = selectedUserIds;
    } else if (selectedUserIds.length === 1) {
      basePayload.user_id = selectedUserIds[0];
    } else if (effectiveUserIds.length > 1) {
      basePayload.user_ids = effectiveUserIds;
    } else {
      basePayload.user_id = effectiveUserIds[0];
    }

    return basePayload;
  }, [date, name, programData, effectiveUserIds, effectiveGroupId]);

  const onSubmit = async () => {
    if (!date) {
      toast.error("Διάλεξε ημερομηνία");
      return;
    }

    setIsSubmitting(true);
    toast.loading("Δημιουργία & ανάθεση προγράμματος...", { id: "quick-assign" });

    try {
      const { data, error } = await supabase.functions.invoke("ai-program-actions", {
        body: payload,
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || "Σφάλμα κατά τη δημιουργία/ανάθεση");
      }

      toast.success(data.message || "Έγινε δημιουργία & ανάθεση!", { id: "quick-assign" });
      window.location.href = "/dashboard/active-programs";
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Άγνωστο σφάλμα";
      console.error("QuickAssignProgramDialog error:", e);
      toast.error(msg, { id: "quick-assign" });
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  // Υπολογισμός στατιστικών προγράμματος
  const programStats = useMemo(() => {
    if (!programData?.weeks) return null;
    
    let totalExercises = 0;
    let totalBlocks = 0;
    
    programData.weeks.forEach(week => {
      week.days?.forEach((day: any) => {
        day.blocks?.forEach((block: any) => {
          totalBlocks++;
          totalExercises += block.exercises?.length || 0;
        });
      });
    });
    
    return { totalExercises, totalBlocks };
  }, [programData]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-none">
        <DialogHeader>
          <DialogTitle>
            {programData ? "Ανάθεση AI Προγράμματος" : "Γρήγορη δημιουργία & ανάθεση"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* RECIPIENTS SECTION - Clickable */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              {effectiveGroupId ? (
                <UsersRound className="h-4 w-4" />
              ) : effectiveUserIds.length > 1 ? (
                <Users className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
              {effectiveGroupId ? 'Ομάδα' : effectiveUserIds.length > 1 ? 'Χρήστες' : 'Χρήστης'}
            </Label>
            
            <Popover open={isUserSelectorOpen} onOpenChange={setIsUserSelectorOpen}>
              <PopoverTrigger asChild>
                <div className="bg-muted/50 p-3 rounded-none cursor-pointer hover:bg-muted/70 transition-colors border border-transparent hover:border-primary/30">
                  {loadingRecipients ? (
                    <p className="text-sm text-muted-foreground">Φόρτωση...</p>
                  ) : effectiveGroupId && recipientGroup ? (
                    // Group display
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <UsersRound className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{recipientGroup.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {recipientGroup.member_count} μέλη
                          </p>
                        </div>
                      </div>
                      <Edit2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ) : recipientUsers.length > 1 ? (
                    // Multiple users display
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        {recipientUsers.map(user => (
                          <div key={user.id} className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback className="text-xs">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Edit2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ) : recipientUsers.length === 1 ? (
                    // Single user display
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={recipientUsers[0].avatar_url} />
                          <AvatarFallback>
                            {getInitials(recipientUsers[0].name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{recipientUsers[0].name}</p>
                          <p className="text-xs text-muted-foreground">{recipientUsers[0].email}</p>
                        </div>
                      </div>
                      <Edit2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Δεν βρέθηκε παραλήπτης{recipientFallbackLabel ? ` (${recipientFallbackLabel})` : ""}
                      </p>
                      <Edit2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-none overflow-hidden" align="start" style={{ maxHeight: '400px' }}>
                <div className="p-3 border-b flex-shrink-0">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Αναζήτηση χρήστη ή ομάδας..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="pl-8 rounded-none"
                    />
                  </div>
                </div>
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {loadingAllUsers ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">Φόρτωση...</div>
                  ) : (
                    <div className="p-2">
                      {/* Groups section */}
                      {allGroups.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-muted-foreground px-2 mb-1">ΟΜΑΔΕΣ</p>
                          {allGroups.map((group) => (
                            <div
                              key={group.id}
                              onClick={() => selectGroup(group.id)}
                              className={`flex items-center gap-3 p-2 cursor-pointer hover:bg-muted/50 ${
                                effectiveGroupId === group.id ? "bg-primary/10" : ""
                              }`}
                            >
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <UsersRound className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{group.name}</p>
                              </div>
                              {effectiveGroupId === group.id && <Check className="h-4 w-4 text-primary" />}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Users section */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground px-2 mb-1">ΧΡΗΣΤΕΣ</p>
                        {filteredUsers.map((user) => {
                          const isSelected = selectedUserIds.includes(user.id) || 
                            (selectedUserIds.length === 0 && effectiveUserIds.includes(user.id) && !effectiveGroupId);
                          return (
                            <div
                              key={user.id}
                              onClick={() => toggleUserSelection(user.id)}
                              className={`flex items-center gap-3 p-2 cursor-pointer hover:bg-muted/50 ${
                                isSelected ? "bg-primary/10" : ""
                              }`}
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar_url} />
                                <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                              </div>
                              {isSelected ? (
                                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                              ) : (
                                <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                {selectedUserIds.length > 0 && (
                  <div className="p-2 border-t flex justify-end">
                    <Button
                      size="sm"
                      className="rounded-none"
                      onClick={() => setIsUserSelectorOpen(false)}
                    >
                      Επιλογή ({selectedUserIds.length})
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="program-name">Όνομα προγράμματος</Label>
            <Input
              id="program-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="program-date">Ημερομηνία προπόνησης</Label>
            <Input
              id="program-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-none"
            />
          </div>

          {/* Εμφάνιση στατιστικών αν υπάρχουν δεδομένα AI */}
          {programStats && (
            <div className="bg-muted/50 p-3 rounded-none text-sm">
              <p className="text-muted-foreground">
                <strong>Blocks:</strong> {programStats.totalBlocks} | 
                <strong> Ασκήσεις:</strong> {programStats.totalExercises}
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="rounded-none">
              Άκυρο
            </Button>
            <Button onClick={onSubmit} disabled={isSubmitting} className="rounded-none">
              {programData ? "Ανάθεση" : "Δημιουργία & Ανάθεση"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
