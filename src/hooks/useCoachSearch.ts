import { useState, useMemo } from 'react';

// Remove Greek accents for search
const removeAccents = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

interface UseCoachSearchProps {
  usersMap: Map<string, { name: string; email?: string }>;
}

export const useCoachSearch = ({ usersMap }: UseCoachSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filterBySearch = useMemo(() => {
    return (coachUserId: string): boolean => {
      if (!searchTerm.trim()) return true;
      
      const user = usersMap.get(coachUserId);
      if (!user) return false;
      
      const searchLower = removeAccents(searchTerm.trim());
      const nameMatch = user.name && removeAccents(user.name).includes(searchLower);
      const emailMatch = user.email && removeAccents(user.email).includes(searchLower);
      
      return nameMatch || emailMatch;
    };
  }, [searchTerm, usersMap]);

  return {
    searchTerm,
    setSearchTerm,
    filterBySearch
  };
};
