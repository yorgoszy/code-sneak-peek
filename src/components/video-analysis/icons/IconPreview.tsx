import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  BoxingIcon, 
  KickIcon, 
  KneeStrikeIcon, 
  ElbowIcon, 
  ClinchIcon,
  MuayThaiIcon 
} from './MartialArtsIcons';

// React Icons samples
import { GiBoxingGlove, GiHighKick, GiPunch, GiFist, GiKneeCap, GiBodyBalance } from 'react-icons/gi';
import { FaFistRaised } from 'react-icons/fa';
import { TbKarate } from 'react-icons/tb';

interface IconPreviewProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IconPreview: React.FC<IconPreviewProps> = ({ isOpen, onClose }) => {
  const customIcons = [
    { name: 'BoxingIcon', icon: <BoxingIcon size={32} /> },
    { name: 'KickIcon', icon: <KickIcon size={32} /> },
    { name: 'KneeStrikeIcon', icon: <KneeStrikeIcon size={32} /> },
    { name: 'ElbowIcon', icon: <ElbowIcon size={32} /> },
    { name: 'ClinchIcon', icon: <ClinchIcon size={32} /> },
    { name: 'MuayThaiIcon', icon: <MuayThaiIcon size={32} /> },
  ];

  const reactIcons = [
    { name: 'GiBoxingGlove', icon: <GiBoxingGlove size={32} /> },
    { name: 'GiHighKick', icon: <GiHighKick size={32} /> },
    { name: 'GiKneeCap', icon: <GiKneeCap size={32} /> },
    { name: 'GiPunch', icon: <GiPunch size={32} /> },
    { name: 'GiFist', icon: <GiFist size={32} /> },
    { name: 'GiBodyBalance', icon: <GiBodyBalance size={32} /> },
    { name: 'FaFistRaised', icon: <FaFistRaised size={32} /> },
    { name: 'TbKarate', icon: <TbKarate size={32} /> },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-none">
        <DialogHeader>
          <DialogTitle>Martial Arts Icons Preview</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Custom SVG Icons */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-gray-700">Custom SVG Icons</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {customIcons.map((item) => (
                <div 
                  key={item.name} 
                  className="flex flex-col items-center p-3 border rounded-none hover:bg-gray-50 transition-colors"
                >
                  <div className="text-gray-800 mb-2">{item.icon}</div>
                  <span className="text-xs text-gray-500 text-center">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* React Icons */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-gray-700">React Icons (Game Icons, Font Awesome, Tabler)</h3>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
              {reactIcons.map((item) => (
                <div 
                  key={item.name} 
                  className="flex flex-col items-center p-3 border rounded-none hover:bg-gray-50 transition-colors"
                >
                  <div className="text-gray-800 mb-2">{item.icon}</div>
                  <span className="text-xs text-gray-500 text-center">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Size Examples */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-gray-700">Size Examples (KneeStrikeIcon)</h3>
            <div className="flex items-end gap-4">
              <div className="flex flex-col items-center">
                <KneeStrikeIcon size={16} />
                <span className="text-xs text-gray-500 mt-1">16px</span>
              </div>
              <div className="flex flex-col items-center">
                <KneeStrikeIcon size={24} />
                <span className="text-xs text-gray-500 mt-1">24px</span>
              </div>
              <div className="flex flex-col items-center">
                <KneeStrikeIcon size={32} />
                <span className="text-xs text-gray-500 mt-1">32px</span>
              </div>
              <div className="flex flex-col items-center">
                <KneeStrikeIcon size={48} />
                <span className="text-xs text-gray-500 mt-1">48px</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
