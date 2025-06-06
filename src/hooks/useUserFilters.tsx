
import { useState, useMemo } from 'react';

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  user_status: string;
  birth_date?: string;
  photo_url?: string;
  created_at: string;
}

export const useUserFilters = (users: AppUser[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || user.user_status === statusFilter;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  return {
    searchTerm,
    roleFilter,
    statusFilter,
    filteredUsers,
    setSearchTerm,
    setRoleFilter,
    setStatusFilter
  };
};
