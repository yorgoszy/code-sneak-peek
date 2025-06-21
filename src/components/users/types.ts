
export interface AppUser {
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

export interface UsersFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  roleFilter: string;
  setRoleFilter: (role: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
}

export interface UsersActionsProps {
  onNewUser: () => void;
  filteredUsersCount: number;
}
