
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Users, X, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GroupSelection } from './GroupSelection';
import type { User as UserType } from '../types';

interface ProgramBasicInfoProps {
  name: string;
  description: string;
  selectedUserId?: string;
  selectedUserIds?: string[];
  selectedGroupId?: string;
  users: UserType[];
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onAthleteChange?: (userId: string) => void;
  onMultipleAthleteChange?: (userIds: string[]) => void;
  onGroupChange?: (groupId: string) => void;
  isMultipleMode?: boolean;
  onToggleMode?: (isMultiple: boolean) => void;
}

export const ProgramBasicInfo: React.FC<ProgramBasicInfoProps> = ({
  name,
  description,
  selectedUserId,
  selectedUserIds = [],
  selectedGroupId = '',
  users,
  onNameChange,
  onDescriptionChange,
  onAthleteChange,
  onMultipleAthleteChange,
  onGroupChange,
  isMultipleMode = false,
  onToggleMode
}) => {
  const [userListOpen, setUserListOpen] = useState(false);
  const [assignmentMode, setAssignmentMode] = useState<'individual' | 'group'>('individual');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const selectedUsers = users.filter(user => selectedUserIds.includes(user.id));
  const availableUsers = users.filter(user => !selectedUserIds.includes(user.id));

  // Add wheel event listener for scrolling
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      scrollContainer.scrollTop += e.deltaY;
    };

    scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      scrollContainer.removeEventListener('wheel', handleWheel);
    };
  }, [userListOpen]);

  const handleUserToggle = (userId: string) => {
    console.log('🔄 ProgramBasicInfo - handleUserToggle called with userId:', userId);
    console.log('🔄 ProgramBasicInfo - Current selectedUserIds:', selectedUserIds);
    console.log('🔄 ProgramBasicInfo - onMultipleAthleteChange function available:', !!onMultipleAthleteChange);
    
    if (!onMultipleAthleteChange) {
      console.log('❌ ProgramBasicInfo - onMultipleAthleteChange not available');
      return;
    }
    
    const newSelectedIds = selectedUserIds.includes(userId)
      ? selectedUserIds.filter(id => id !== userId)
      : [...selectedUserIds, userId];
    
    console.log('✅ ProgramBasicInfo - Updating selectedUserIds from:', selectedUserIds, 'to:', newSelectedIds);
    onMultipleAthleteChange(newSelectedIds);
    
    // Close popover after adding a user (but not when removing)
    if (!selectedUserIds.includes(userId)) {
      setUserListOpen(false);
    }
  };

  const handleClearAll = () => {
    console.log('🧹 ProgramBasicInfo - Clearing all selected users');
    if (onMultipleAthleteChange) {
      onMultipleAthleteChange([]);
    }
  };

  const handleUserClick = (userId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('👆 ProgramBasicInfo - User clicked:', userId);
    handleUserToggle(userId);
  };

  const handleRemoveUser = (userId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('🗑️ ProgramBasicInfo - Removing user:', userId);
    handleUserToggle(userId);
  };

  const handleAssignmentModeChange = (mode: 'individual' | 'group') => {
    setAssignmentMode(mode);
    if (mode === 'group' && onMultipleAthleteChange) {
      // Clear individual selections when switching to group mode
      onMultipleAthleteChange([]);
    }
    if (mode === 'individual' && onGroupChange) {
      // Clear group selection when switching to individual mode
      onGroupChange('');
    }
  };

  const handleGroupMembersLoad = (userIds: string[]) => {
    if (onMultipleAthleteChange) {
      onMultipleAthleteChange(userIds);
    }
  };

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle>Βασικές Πληροφορίες Προγράμματος</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="program-name">Όνομα Προγράμματος</Label>
          <Input
            id="program-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Εισάγετε το όνομα του προγράμματος"
            className="rounded-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="program-description">Περιγραφή</Label>
          <Textarea
            id="program-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Προαιρετική περιγραφή του προγράμματος"
            className="rounded-none"
            rows={3}
          />
        </div>

        {/* Assignment Type Selection */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Τύπος Ανάθεσης</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleAssignmentModeChange('individual')}
                className={`px-3 py-2 text-sm rounded-none border transition-colors ${
                  assignmentMode === 'individual'
                    ? 'bg-[#00ffba] text-black border-[#00ffba]'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <User className="w-4 h-4 inline mr-2" />
                Ατομική
              </button>
              <button
                type="button"
                onClick={() => handleAssignmentModeChange('group')}
                className={`px-3 py-2 text-sm rounded-none border transition-colors ${
                  assignmentMode === 'group'
                    ? 'bg-[#00ffba] text-black border-[#00ffba]'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Ομαδική
              </button>
            </div>
          </div>

          {/* Individual User Selection */}
          {assignmentMode === 'individual' && (
            <div className="flex gap-4">
              {/* User Selection Box - 60% width */}
              <div className="w-[60%]">
                <Card className="rounded-none">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4" />
                      Επιλογή Χρηστών
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Popover open={userListOpen} onOpenChange={setUserListOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal rounded-none"
                            disabled={availableUsers.length === 0}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            {availableUsers.length === 0 
                              ? "Όλοι οι χρήστες έχουν επιλεγεί" 
                              : "Προσθήκη χρήστη..."
                            }
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0 rounded-none" align="start">
                          <div 
                            ref={scrollContainerRef}
                            className="max-h-60 overflow-y-auto p-2"
                            style={{ scrollBehavior: 'smooth' }}
                          >
                            {availableUsers.length === 0 ? (
                              <div className="p-4 text-center text-sm text-gray-500">
                                Όλοι οι χρήστες έχουν επιλεγεί
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {availableUsers.map(user => (
                                  <div
                                    key={user.id}
                                    className="w-full p-3 rounded hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200 cursor-pointer select-none"
                                    onClick={(e) => handleUserClick(user.id, e)}
                                    onMouseDown={(e) => e.preventDefault()}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <div className="flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        <div className="text-left">
                                          <p className="font-medium text-sm">{user.name}</p>
                                          <p className="text-xs text-gray-600">{user.email}</p>
                                        </div>
                                      </div>
                                      <Plus className="w-4 h-4 text-[#00ffba]" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {selectedUsers.length > 0 && (
                      <div className="text-sm text-gray-600 bg-blue-50 p-3 border border-blue-200 rounded">
                        <Users className="w-4 h-4 inline mr-2" />
                        Θα δημιουργηθούν {selectedUsers.length} ατομικές αναθέσεις με τις ίδιες ημερομηνίες προπόνησης.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Selected Users Display - 40% width */}
              <div className="w-[40%]">
                <Card className="rounded-none">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Επιλεγμένοι ({selectedUsers.length})
                      </span>
                      {selectedUsers.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearAll}
                          className="rounded-none text-xs h-6 px-2"
                        >
                          Καθαρισμός
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedUsers.length === 0 ? (
                      <div className="text-center text-sm text-gray-500 py-4">
                        Δεν έχουν επιλεγεί χρήστες
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {selectedUsers.map(user => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between bg-[#00ffba]/10 border border-[#00ffba]/20 p-2 rounded hover:bg-[#00ffba]/20 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <User className="w-3 h-3 text-[#00ffba] flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-xs truncate">{user.name}</p>
                                <p className="text-xs text-gray-600 truncate">{user.email}</p>
                                {user.role && (
                                  <Badge variant="outline" className="mt-1 text-xs rounded-none h-4 px-1">
                                    {user.role}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleRemoveUser(user.id, e)}
                              className="rounded-none p-1 h-auto text-gray-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                              title="Αφαίρεση από την επιλογή"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Group Selection */}
          {assignmentMode === 'group' && onGroupChange && (
            <GroupSelection
              selectedGroupId={selectedGroupId}
              onGroupChange={onGroupChange}
              onGroupMembersLoad={handleGroupMembersLoad}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
