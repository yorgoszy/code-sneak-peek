
import React from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Eye } from "lucide-react";
import { formatDate, getRoleColor, getStatusColor } from "./utils";
import type { AppUser } from "./types";

interface UsersTableProps {
  users: AppUser[];
  onEdit: (user: AppUser) => void;
  onDelete: (user: AppUser) => void;
  onView: (user: AppUser) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  onEdit,
  onDelete,
  onView
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Όνομα</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Ρόλος</TableHead>
          <TableHead>Τηλέφωνο</TableHead>
          <TableHead>Κατάσταση</TableHead>
          <TableHead>Εγγραφή</TableHead>
          <TableHead>Ενέργειες</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">
              <div className="flex items-center space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.photo_url} alt={user.name} />
                  <AvatarFallback>
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{user.name}</span>
              </div>
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <span className={`px-2 py-1 text-xs rounded ${getRoleColor(user.role)}`}>
                {user.role}
              </span>
            </TableCell>
            <TableCell>{user.phone || '-'}</TableCell>
            <TableCell>
              <span className={`px-2 py-1 text-xs rounded ${getStatusColor(user.user_status)}`}>
                {user.user_status}
              </span>
            </TableCell>
            <TableCell>{formatDate(user.created_at)}</TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-none"
                  onClick={() => onView(user)}
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-none"
                  onClick={() => onEdit(user)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-none text-red-600 hover:text-red-700"
                  onClick={() => onDelete(user)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
