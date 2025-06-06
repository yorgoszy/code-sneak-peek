
import React from 'react';
import { Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

interface UserTableProps {
  users: AppUser[];
  loading: boolean;
  onViewUser: (user: AppUser) => void;
  onEditUser: (user: AppUser) => void;
  onDeleteUser: (user: AppUser) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  loading,
  onViewUser,
  onEditUser,
  onDeleteUser
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('el-GR');
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'trainer':
        return 'bg-blue-100 text-blue-800';
      case 'athlete':
        return 'bg-green-100 text-green-800';
      case 'general':
        return 'bg-purple-100 text-purple-800';
      case 'parent':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Φόρτωση χρηστών...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Δεν βρέθηκαν χρήστες</p>
      </div>
    );
  }

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
                <Avatar className="w-8 h-8 rounded-none">
                  <AvatarImage src={user.photo_url} alt={user.name} />
                  <AvatarFallback className="rounded-none">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{user.name}</span>
              </div>
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <span className={`px-2 py-1 text-xs rounded-none ${getRoleColor(user.role)}`}>
                {user.role}
              </span>
            </TableCell>
            <TableCell>{user.phone || '-'}</TableCell>
            <TableCell>
              <span className={`px-2 py-1 text-xs rounded-none ${getStatusColor(user.user_status)}`}>
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
                  onClick={() => onViewUser(user)}
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-none"
                  onClick={() => onEditUser(user)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-none text-red-600 hover:text-red-700"
                  onClick={() => onDeleteUser(user)}
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
