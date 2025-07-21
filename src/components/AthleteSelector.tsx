
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { matchesSearchTerm } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AthleteSelectorProps {
  selectedAthleteIds: string[];
  onAthleteToggle: (athleteId: string) => void;
  onSelectAll: () => void;
}

export const AthleteSelector = ({ selectedAthleteIds, onAthleteToggle, onSelectAll }: AthleteSelectorProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('app_users')
      .select('id, name, email')
      .order('name');
    setUsers(data || []);
  };

  const filteredUsers = users.filter(user =>
    matchesSearchTerm(user.name, searchTerm)
  );

  const selectedUsers = users.filter(user => selectedAthleteIds.includes(user.id));

  const handleAthleteSelect = (athleteId: string) => {
    onAthleteToggle(athleteId);
    setIsSearchOpen(false);
    setSearchTerm('');
  };

  const removeAthlete = (athleteId: string) => {
    onAthleteToggle(athleteId);
  };

  return (
    <Card className="rounded-none mb-6">
      <CardHeader>
        <CardTitle>Επιλογή Αθλητών</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Αθλητές</Label>
            <button
              onClick={onSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {selectedAthleteIds.length === users.length ? 'Αποεπιλογή όλων' : 'Επιλογή όλων'}
            </button>
          </div>

          {/* Selected Athletes Display */}
          <div className="space-y-2">
            {selectedUsers.map(user => (
              <div
                key={user.id}
                className="flex items-center justify-between bg-blue-50 text-blue-700 p-3 border border-blue-200"
              >
                <span className="font-medium">{user.name}</span>
                <button
                  onClick={() => removeAthlete(user.id)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Search Button */}
          <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal rounded-none"
              >
                <Search className="mr-2 h-4 w-4" />
                Αναζήτηση αθλητή...
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 rounded-none" align="start">
              <Command className="border-0">
                <CommandInput 
                  placeholder="Αναζήτηση αθλητή..." 
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                <CommandList className="max-h-48">
                  <CommandEmpty>Δεν βρέθηκε αθλητής</CommandEmpty>
                  {filteredUsers.map(user => (
                    <CommandItem
                      key={user.id}
                      className={`cursor-pointer p-3 hover:bg-gray-100 ${
                        selectedAthleteIds.includes(user.id) ? 'bg-blue-50 text-blue-700 font-medium' : ''
                      }`}
                      onSelect={() => handleAthleteSelect(user.id)}
                    >
                      {user.name}
                      {selectedAthleteIds.includes(user.id) && (
                        <span className="ml-auto text-blue-600">✓</span>
                      )}
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {selectedAthleteIds.length > 0 && (
            <div className="text-sm text-gray-600">
              <p>Επιλεγμένοι αθλητές: {selectedAthleteIds.length}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
