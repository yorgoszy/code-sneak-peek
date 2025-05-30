
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

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
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSelectedAthleteNames = () => {
    return users
      .filter(user => selectedAthleteIds.includes(user.id))
      .map(user => user.name)
      .join(', ');
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

          <Command className="border border-gray-200 bg-white">
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
                  onSelect={() => onAthleteToggle(user.id)}
                >
                  {user.name}
                  {selectedAthleteIds.includes(user.id) && (
                    <span className="ml-auto text-blue-600">✓</span>
                  )}
                </CommandItem>
              ))}
            </CommandList>
          </Command>

          {selectedAthleteIds.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Επιλεγμένοι ({selectedAthleteIds.length}): {getSelectedAthleteNames()}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
