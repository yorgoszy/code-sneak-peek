import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface IconPreviewProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IconPreview: React.FC<IconPreviewProps> = ({ isOpen, onClose }) => {
  const emojiOptions = [
    // Punch/Box options
    { category: 'Punch (Box)', emojis: ['🥊', '👊', '🤛', '🤜', '💪'] },
    // Kick options
    { category: 'Kick', emojis: ['🦵', '🦶', '💥', '⚡'] },
    // Knee options
    { category: 'Knee', emojis: ['🦵', '🔺', '⬆️', '🎯'] },
    // Elbow options
    { category: 'Elbow', emojis: ['💪', '🔻', '➡️', '⚔️'] },
    // Clinch options
    { category: 'Clinch', emojis: ['🤼', '🤝', '🔒', '⛓️'] },
    // Muay Thai
    { category: 'Muay Thai', emojis: ['🥋', '🇹🇭', '🏆', '🔥'] },
    // Muay Plam
    { category: 'Muay Plam', emojis: ['🤼‍♂️', '🫂', '🔗', '💀'] },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-none">
        <DialogHeader>
          <DialogTitle>Strike Category Emojis</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {emojiOptions.map((group) => (
            <div key={group.category} className="border rounded-none p-3">
              <h3 className="text-sm font-semibold mb-3 text-gray-700">{group.category}</h3>
              <div className="flex gap-4">
                {group.emojis.map((emoji, idx) => (
                  <div 
                    key={idx} 
                    className="flex flex-col items-center p-3 border rounded-none hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <span className="text-4xl">{emoji}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
