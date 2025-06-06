
import React from 'react';

interface ProgramDetailsSidebarProps {
  onClose: () => void;
  activeSection: number;
  onSectionChange: (section: number) => void;
}

export const ProgramDetailsSidebar: React.FC<ProgramDetailsSidebarProps> = ({ 
  onClose, 
  activeSection, 
  onSectionChange 
}) => {
  const sections = [
    { id: 1, title: "Program Details" },
    { id: 2, title: "Program Benefits" },
    { id: 3, title: "Weekly Schedule" },
    { id: 4, title: "Pricing Plans" }
  ];

  return (
    <div className="w-80 bg-black p-8 border-r border-gray-700">
      <div className="mb-8">
        <div className="text-[#00ffba] text-sm font-medium mb-4">PROGRAM INFORMATION</div>
        <h1 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Robert, sans-serif' }}>
          Begin Your
        </h1>
        <h1 className="text-4xl font-bold mb-8" style={{ color: '#00ffba', fontFamily: 'Robert, sans-serif' }}>
          Training Journey
        </h1>
      </div>

      <nav className="space-y-6">
        {sections.map((section) => (
          <div 
            key={section.id}
            className="flex items-center gap-4 cursor-pointer transition-all duration-300 hover:opacity-80"
            onClick={() => onSectionChange(section.id)}
          >
            <span className={`text-xl font-bold ${activeSection === section.id ? 'text-[#00ffba]' : 'text-gray-500'}`}>
              {section.id.toString().padStart(2, '0')}
            </span>
            <span className={`font-medium transition-all duration-300 ${
              activeSection === section.id 
                ? 'text-white border-b border-[#00ffba] pb-1' 
                : 'text-gray-500'
            }`}>
              {section.title}
            </span>
          </div>
        ))}
      </nav>
    </div>
  );
};
