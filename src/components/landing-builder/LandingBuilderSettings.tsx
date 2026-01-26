import React, { useState } from 'react';
import { useEditor } from '@craftjs/core';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const LandingBuilderSettings: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  
  const { selected, actions } = useEditor((state, query) => {
    const currentNodeId = query.getEvent('selected').last();
    let selected;

    if (currentNodeId) {
      selected = {
        id: currentNodeId,
        name: state.nodes[currentNodeId]?.data.name,
        settings: state.nodes[currentNodeId]?.related?.settings,
        isDeletable: query.node(currentNodeId).isDeletable(),
      };
    }

    return { selected };
  });

  return (
    <div className="p-3">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-1 hover:bg-accent/50 transition-colors">
          <span className="font-semibold text-sm text-foreground">Settings</span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="py-2">
            {selected?.id ? (
              <div className="space-y-3">
                <div className="p-2 bg-muted rounded-none">
                  <Label className="text-xs text-muted-foreground">Selected</Label>
                  <p className="font-medium text-sm text-foreground">{selected.name}</p>
                </div>
                
                {selected.settings && React.createElement(selected.settings)}
                
                {selected.isDeletable && (
                  <button
                    onClick={() => actions.delete(selected.id)}
                    className="w-full py-1.5 px-3 text-sm bg-destructive text-destructive-foreground rounded-none hover:bg-destructive/90 transition-colors"
                  >
                    Διαγραφή
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-xs">Επιλέξτε component</p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
