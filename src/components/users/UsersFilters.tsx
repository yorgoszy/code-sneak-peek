
import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import type { UsersFiltersProps } from "./types";

export const UsersFilters: React.FC<UsersFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mt-3 md:mt-4">
      <div className="relative">
        <Search className="absolute left-2 md:left-3 top-2 md:top-3 h-3 md:h-4 w-3 md:w-4 text-gray-400" />
        <Input
          placeholder="Αναζήτηση χρηστών..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8 md:pl-10 text-xs md:text-sm rounded-none"
        />
      </div>
      
      <Select value={roleFilter} onValueChange={setRoleFilter}>
        <SelectTrigger className="rounded-none">
          <Filter className="h-3 md:h-4 w-3 md:w-4 mr-1 md:mr-2" />
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
      
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="rounded-none">
          <Filter className="h-3 md:h-4 w-3 md:w-4 mr-1 md:mr-2" />
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
