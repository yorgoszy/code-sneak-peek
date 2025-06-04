
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { X, Minimize2, Plus, Search, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AthleteSelector } from "@/components/AthleteSelector";
import { UserProfileCalendar } from "@/components/user-profile/UserProfileCalendar";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  name: string;
  email: string;
}

interface QuadrantData {
  id: string;
  title: string;
  selectedUser?: User;
}

const RunMode = () => {
  const navigate = useNavigate();
  const [isMinimized, setIsMinimized] = useState(false);
  const [quadrants, setQuadrants] = useState<QuadrantData[]>([
    { id: '1', title: 'Τεταρτημόριο 1' },
    { id: '2', title: 'Τεταρτημόριο 2' },
    { id: '3', title: 'Τεταρτημόριο 3' },
    { id: '4', title: 'Τεταρτημόριο 4' },
  ]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerms, setSearchTerms] = useState<{[key: string]: string}>({});
  const [openPopovers, setOpenPopovers] = useState<{[key: string]: boolean}>({});

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('app_users')
      .select('id, name, email')
      .order('name');
    setUsers(data || []);
  };

  const handleClose = () => {
    navigate('/dashboard');
  };

  const handleMinimize = () => {
    navigate('/dashboard');
  };

  const handleAddQuadrant = () => {
    const newId = (quadrants.length + 1).toString();
    const newQuadrant: QuadrantData = {
      id: newId,
      title: `Τεταρτημόριο ${newId}`
    };
    setQuadrants([...quadrants, newQuadrant]);
  };

  const handleUserSelect = (quadrantId: string, user: User) => {
    setQuadrants(prev => prev.map(q => 
      q.id === quadrantId 
        ? { ...q, selectedUser: user }
        : q
    ));
    setOpenPopovers(prev => ({ ...prev, [quadrantId]: false }));
    setSearchTerms(prev => ({ ...prev, [quadrantId]: '' }));
  };

  const removeUser = (quadrantId: string) => {
    setQuadrants(prev => prev.map(q => 
      q.id === quadrantId 
        ? { ...q, selectedUser: undefined }
        : q
    ));
  };

  const getFilteredUsers = (quadrantId: string) => {
    const searchTerm = searchTerms[quadrantId] || '';
    return users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-black text-white p-4 rounded-none shadow-lg min-w-[200px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Run Mode</h3>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMinimize}
                className="h-6 w-6 p-0 text-white hover:bg-[#00ffba] hover:text-black rounded-none"
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-6 w-6 p-0 text-white hover:bg-[#00ffba] hover:text-black rounded-none"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-300">Ελαχιστοποιημένο</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black text-white z-50">
      {/* Header Bar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">Run Mode</h1>
        <div className="flex space-x-2">
          <Button
            onClick={handleAddQuadrant}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-[#00ffba] hover:text-black rounded-none"
          >
            <Plus className="h-4 w-4 mr-2" />
            Προσθήκη Τεταρτημορίου
          </Button>
          <Button
            onClick={handleMinimize}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-[#00ffba] hover:text-black rounded-none"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-[#00ffba] hover:text-black rounded-none"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quadrants Grid with Scroll */}
      <div className="flex-1 h-[calc(100vh-80px)]">
        <ScrollArea className="h-full w-full">
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              {quadrants.map((quadrant) => (
                <div
                  key={quadrant.id}
                  className="bg-gray-900 border border-gray-700 rounded-none p-4 flex flex-col h-[calc(50vh-60px)]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">{quadrant.title}</h2>
                    <Button
                      onClick={() => setQuadrants(quadrants.filter(q => q.id !== quadrant.id))}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-white hover:bg-[#00ffba] hover:text-black rounded-none"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {/* User Selection */}
                  <div className="mb-4">
                    {quadrant.selectedUser ? (
                      <div className="flex items-center justify-between bg-gray-800 p-3 border border-gray-600">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium text-sm">{quadrant.selectedUser.name}</span>
                        </div>
                        <button
                          onClick={() => removeUser(quadrant.id)}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <Popover 
                        open={openPopovers[quadrant.id] || false} 
                        onOpenChange={(open) => setOpenPopovers(prev => ({ ...prev, [quadrant.id]: open }))}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal rounded-none bg-gray-800 border-gray-600 text-white text-sm"
                          >
                            <Search className="mr-2 h-4 w-4" />
                            Επιλογή ασκουμένου...
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 rounded-none bg-white" align="start">
                          <Command className="border-0">
                            <CommandInput 
                              placeholder="Αναζήτηση ασκουμένου..." 
                              value={searchTerms[quadrant.id] || ''}
                              onValueChange={(value) => setSearchTerms(prev => ({ ...prev, [quadrant.id]: value }))}
                            />
                            <CommandList className="max-h-48">
                              <CommandEmpty>Δεν βρέθηκε ασκούμενος</CommandEmpty>
                              {getFilteredUsers(quadrant.id).map(user => (
                                <CommandItem
                                  key={user.id}
                                  className="cursor-pointer p-3 hover:bg-gray-100"
                                  onSelect={() => handleUserSelect(quadrant.id, user)}
                                >
                                  <User className="mr-2 h-4 w-4" />
                                  {user.name}
                                </CommandItem>
                              ))}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>

                  {/* Calendar or Empty State */}
                  <div className="flex-1 bg-gray-800 rounded-none overflow-hidden">
                    {quadrant.selectedUser ? (
                      <div className="h-full w-full">
                        <UserProfileCalendar user={quadrant.selectedUser} />
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-gray-400 text-center text-sm">
                          Επιλέξτε ασκούμενο για να δείτε το ημερολόγιό του
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default RunMode;
