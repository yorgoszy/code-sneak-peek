
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('el-GR');
};

export const getRoleColor = (role: string) => {
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

export const getStatusColor = (status: string) => {
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

export const filterUsers = (
  users: any[], 
  searchTerm: string, 
  roleFilter: string, 
  statusFilter: string
) => {
  return users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.user_status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });
};
