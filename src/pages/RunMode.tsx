
import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { RunModeHeader } from "@/components/run-mode/RunModeHeader";
import { RunModeGrid } from "@/components/run-mode/RunModeGrid";
import { RunModeMinimized } from "@/components/run-mode/RunModeMinimized";

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

  const handleRemoveQuadrant = (quadrantId: string) => {
    setQuadrants(quadrants.filter(q => q.id !== quadrantId));
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

  const handleRemoveUser = (quadrantId: string) => {
    setQuadrants(prev => prev.map(q => 
      q.id === quadrantId 
        ? { ...q, selectedUser: undefined }
        : q
    ));
  };

  const handleSearchChange = (quadrantId: string, value: string) => {
    setSearchTerms(prev => ({ ...prev, [quadrantId]: value }));
  };

  const handlePopoverOpenChange = (quadrantId: string, open: boolean) => {
    setOpenPopovers(prev => ({ ...prev, [quadrantId]: open }));
  };

  if (isMinimized) {
    return (
      <RunModeMinimized
        onMinimize={handleMinimize}
        onClose={handleClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black text-white z-50">
      <RunModeHeader
        onAddQuadrant={handleAddQuadrant}
        onMinimize={handleMinimize}
        onClose={handleClose}
      />
      
      <RunModeGrid
        quadrants={quadrants}
        users={users}
        searchTerms={searchTerms}
        openPopovers={openPopovers}
        onRemoveQuadrant={handleRemoveQuadrant}
        onSearchChange={handleSearchChange}
        onPopoverOpenChange={handlePopoverOpenChange}
        onUserSelect={handleUserSelect}
        onRemoveUser={handleRemoveUser}
      />
    </div>
  );
};

export default RunMode;
