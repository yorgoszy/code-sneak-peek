import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  BoxingIcon, 
  KickIcon, 
  KneeStrikeIcon, 
  ElbowIcon, 
  ClinchIcon,
  MuayThaiIcon,
  MuayPlamIcon
} from './MartialArtsIcons';

interface IconPreviewProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IconPreview: React.FC<IconPreviewProps> = ({ isOpen, onClose }) => {
  const customIcons = [
    { name: 'Punch (Box)', icon: <BoxingIcon size={48} />, category: 'punch' },
    { name: 'Kick', icon: <KickIcon size={48} />, category: 'kick' },
    { name: 'Knee Strike', icon: <KneeStrikeIcon size={48} />, category: 'knee' },
    { name: 'Elbow', icon: <ElbowIcon size={48} />, category: 'elbow' },
    { name: 'Clinch', icon: <ClinchIcon size={48} />, category: 'clinch' },
    { name: 'Muay Thai', icon: <MuayThaiIcon size={48} />, category: 'muay_thai' },
    { name: 'Muay Plam', icon: <MuayPlamIcon size={48} />, category: 'muay_plam' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl rounded-none">
        <DialogHeader>
          <DialogTitle>Martial Arts Icons - Custom Silhouettes</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Custom SVG Icons */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-gray-700">Strike Category Icons</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {customIcons.map((item) => (
                <div 
                  key={item.name} 
                  className="flex flex-col items-center p-4 border rounded-none hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="text-gray-800 mb-3">{item.icon}</div>
                  <span className="text-sm font-medium text-gray-700 text-center">{item.name}</span>
                  <span className="text-xs text-gray-400 mt-1">{item.category}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Size Examples */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-gray-700">Size Comparison</h3>
            <div className="flex items-end gap-6 justify-center bg-gray-50 p-4 rounded-none">
              <div className="flex flex-col items-center">
                <KneeStrikeIcon size={24} />
                <span className="text-xs text-gray-500 mt-2">24px</span>
              </div>
              <div className="flex flex-col items-center">
                <KneeStrikeIcon size={32} />
                <span className="text-xs text-gray-500 mt-2">32px</span>
              </div>
              <div className="flex flex-col items-center">
                <KneeStrikeIcon size={48} />
                <span className="text-xs text-gray-500 mt-2">48px</span>
              </div>
              <div className="flex flex-col items-center">
                <KneeStrikeIcon size={64} />
                <span className="text-xs text-gray-500 mt-2">64px</span>
              </div>
            </div>
          </div>

          {/* All Icons at Large Size */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-gray-700">Large Preview (64px)</h3>
            <div className="flex gap-4 justify-center bg-gray-50 p-4 rounded-none flex-wrap">
              <BoxingIcon size={64} />
              <KickIcon size={64} />
              <KneeStrikeIcon size={64} />
              <ElbowIcon size={64} />
              <ClinchIcon size={64} />
              <MuayThaiIcon size={64} />
              <MuayPlamIcon size={64} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
