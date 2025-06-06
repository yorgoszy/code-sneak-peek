
import React from 'react';
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserFiltersProps {
  searchTerm: string;
  roleFilter: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  searchTerm,
  roleFilter,
  statusFilter,
  onSearchChange,
  onRoleFilterChange,
  onStatusFilterChange
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Αναζήτηση χρηστών..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 rounded-none"
        />
      </div>
      
      <Select value={roleFilter} onValueChange={onRoleFilterChange}>
        <SelectTrigger className="rounded-none">
          <Filter className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Φίλτρο ρόλου" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Όλοι οι ρόλοι</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="trainer">Trainer</SelectItem>
          <SelectItem value="athlete">Athlete</SelectItem>
          <SelectItem value="general">General</SelectItem>
          <SelectItem value="parent">Parent</SelectItem>
        </SelectContent>
      </Select>
      
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="rounded-none">
          <Filter className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Φίλτρο κατάστασης" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Όλες οι καταστάσεις</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
