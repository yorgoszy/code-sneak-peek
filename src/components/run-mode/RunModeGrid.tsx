
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { RunModeQuadrant } from './RunModeQuadrant';

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

interface RunModeGridProps {
  quadrants: QuadrantData[];
  users: User[];
  searchTerms: {[key: string]: string};
  openPopovers: {[key: string]: boolean};
  onRemoveQuadrant: (quadrantId: string) => void;
  onSearchChange: (quadrantId: string, value: string) => void;
  onPopoverOpenChange: (quadrantId: string, open: boolean) => void;
  onUserSelect: (quadrantId: string, user: User) => void;
  onRemoveUser: (quadrantId: string) => void;
}

export const RunModeGrid: React.FC<RunModeGridProps> = ({
  quadrants,
  users,
  searchTerms,
  openPopovers,
  onRemoveQuadrant,
  onSearchChange,
  onPopoverOpenChange,
  onUserSelect,
  onRemoveUser
}) => {
  return (
    <div className="flex-1 h-[calc(100vh-80px)]">
      <ScrollArea className="h-full w-full">
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {quadrants.map((quadrant) => (
              <RunModeQuadrant
                key={quadrant.id}
                quadrant={quadrant}
                users={users}
                searchTerm={searchTerms[quadrant.id] || ''}
                isPopoverOpen={openPopovers[quadrant.id] || false}
                onRemove={() => onRemoveQuadrant(quadrant.id)}
                onSearchChange={(value) => onSearchChange(quadrant.id, value)}
                onPopoverOpenChange={(open) => onPopoverOpenChange(quadrant.id, open)}
                onUserSelect={(user) => onUserSelect(quadrant.id, user)}
                onRemoveUser={() => onRemoveUser(quadrant.id)}
              />
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
