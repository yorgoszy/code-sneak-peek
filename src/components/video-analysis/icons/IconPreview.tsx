import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface IconPreviewProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IconPreview: React.FC<IconPreviewProps> = ({ isOpen, onClose }) => {
  const emojiOptions = [
    // Punch/Box options
    { category: 'Punch (Box)', emojis: ['🥊', '👊', '🤛', '🤜', '💪', '✊', '👋', '🫲', '🫳', '🫴'] },
    // Kick options
    { category: 'Kick', emojis: ['🦵', '🦶', '💥', '⚡', '🌀', '💨', '🔥', '⭐', '✨', '💫'] },
    // Knee options
    { category: 'Knee', emojis: ['🦵', '🔺', '⬆️', '🎯', '📍', '🔼', '⏫', '🔝', '⤴️', '↗️'] },
    // Elbow options
    { category: 'Elbow', emojis: ['💪', '🔻', '➡️', '⚔️', '🗡️', '↘️', '⤵️', '↪️', '🔽', '⏬'] },
    // Clinch options
    { category: 'Clinch', emojis: ['🤼', '🤝', '🔒', '⛓️', '🫂', '👐', '🙌', '🤲', '🔗', '⚓'] },
    // Muay Thai
    { category: 'Muay Thai', emojis: ['🥋', '🇹🇭', '🏆', '🔥', '👑', '⚡', '💀', '🐅', '🐉', '🦁'] },
    // Muay Plam
    { category: 'Muay Plam', emojis: ['🤼‍♂️', '🫂', '🔗', '💀', '⛓️‍💥', '🦾', '🤺', '🎭', '🎪', '🏴‍☠️'] },
    // General Combat
    { category: 'General Combat', emojis: ['⚔️', '🗡️', '🛡️', '💣', '💢', '❌', '⭕', '❗', '‼️', '⁉️'] },
    // Status/Result
    { category: 'Status', emojis: ['✅', '❌', '⚠️', '🚫', '💯', '🎯', '🏅', '🥇', '🥈', '🥉'] },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] rounded-none">
        <DialogHeader>
          <DialogTitle>Strike Category Emojis</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            {emojiOptions.map((group) => (
              <div key={group.category} className="border rounded-none p-3">
                <h3 className="text-sm font-semibold mb-3 text-gray-700">{group.category}</h3>
                <div className="flex flex-wrap gap-2">
                  {group.emojis.map((emoji, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-center w-12 h-12 border rounded-none hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <span className="text-2xl">{emoji}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
