
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Navigation, User } from 'lucide-react';
import { ProgramCalendar } from '../active-programs/ProgramCalendar';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RunModeQuarterProps {
  quarterId: number;
  programs: EnrichedAssignment[];
  onRemove: () => void;
  canRemove: boolean;
}

export const RunModeQuarter: React.FC<RunModeQuarterProps> = ({
  quarterId,
  programs,
  onRemove,
  canRemove
}) => {
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Παίρνουμε όλους τους μοναδικούς χρήστες από τα προγράμματα
  const uniqueUsers = programs.reduce((acc, program) => {
    if (program.app_users && !acc.find(u => u.id === program.app_users.id)) {
      acc.push(program.app_users);
    }
    return acc;
  }, [] as any[]);

  // Αυτόματη επιλογή του πρώτου χρήστη αν δεν έχει επιλεγεί κανένας
  useEffect(() => {
    if (uniqueUsers.length > 0 && !selectedUserId) {
      setSelectedUserId(uniqueUsers[0].id);
    }
  }, [uniqueUsers, selectedUserId]);

  // Φιλτράρουμε τα προγράμματα για τον επιλεγμένο χρήστη
  const userPrograms = programs.filter(program => 
    program.app_users?.id === selectedUserId
  );

  const selectedUser = uniqueUsers.find(user => user.id === selectedUserId);

  const handleRefresh = () => {
    console.log('Refreshing quarter calendar...');
  };

  const handleNavigate = () => {
    navigate('/dashboard');
  };

  return (
    <Card className="border-2 border-gray-600 bg-gray-900/50 bg-opacity-80 backdrop-blur-sm h-full flex flex-col relative">
      <CardHeader className="pb-1 flex-shrink-0 p-2">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xs font-medium text-white">Τετάρτημόριο {quarterId}</h3>
          <div className="flex items-center space-x-1">
            <Button
              onClick={handleNavigate}
              variant="ghost"
              size="sm"
              className="text-[#00ffba] hover:text-white hover:bg-[#00ffba]/20 p-1 h-6 w-6"
            >
              <Navigation className="h-3 w-3" />
            </Button>
            {canRemove && (
              <Button
                onClick={onRemove}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 h-6 w-6"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Επιλογή Αθλητή */}
        {uniqueUsers.length > 0 ? (
          <div className="space-y-2">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="h-8 text-xs bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Επιλέξτε αθλητή" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {uniqueUsers.map((user) => (
                  <SelectItem 
                    key={user.id} 
                    value={user.id}
                    className="text-white hover:bg-gray-700"
                  >
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-4 h-4">
                        <AvatarImage src={user.photo_url} alt={user.name} />
                        <AvatarFallback className="text-xs">
                          {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{user.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Πληροφορίες Επιλεγμένου Αθλητή */}
            {selectedUser && (
              <div className="flex items-center space-x-2 p-2 bg-gray-800/50 border border-gray-600">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={selectedUser.photo_url} alt={selectedUser.name} />
                  <AvatarFallback className="text-xs">
                    {selectedUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{selectedUser.name}</p>
                  <p className="text-xs text-gray-400 truncate">{selectedUser.email}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-2 p-2 bg-gray-800/50 border border-gray-600">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-400">Δεν υπάρχουν αθλητές</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-1 relative">
        <div className="h-full w-full">
          <ProgramCalendar 
            programs={userPrograms}
            onRefresh={handleRefresh}
            isCompactMode={true}
            containerId={`quarter-${quarterId}`}
          />
        </div>
      </CardContent>
    </Card>
  );
};
