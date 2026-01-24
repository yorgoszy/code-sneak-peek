import React from 'react';
import { useEditor } from '@craftjs/core';
import { Label } from '@/components/ui/label';

export const LandingBuilderSettings: React.FC = () => {
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
    <div className="p-4">
      <h3 className="font-semibold text-lg mb-4 text-foreground">Settings</h3>
      
      {selected?.id ? (
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-none">
            <Label className="text-sm text-muted-foreground">Selected</Label>
            <p className="font-medium text-foreground">{selected.name}</p>
          </div>
          
          {selected.settings && React.createElement(selected.settings)}
          
          {selected.isDeletable && (
            <button
              onClick={() => actions.delete(selected.id)}
              className="w-full py-2 px-4 bg-destructive text-destructive-foreground rounded-none hover:bg-destructive/90 transition-colors"
            >
              Διαγραφή
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Επιλέξτε ένα component για να δείτε τις ρυθμίσεις του</p>
        </div>
      )}
    </div>
  );
};
