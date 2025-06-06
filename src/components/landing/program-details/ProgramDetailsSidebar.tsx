
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
    { id: 1, title: "Λεπτομέρειες Προγράμματος" },
    { id: 2, title: "Οφέλη Προγράμματος" },
    { id: 3, title: "Εβδομαδιαίο Πρόγραμμα" },
    { id: 4, title: "Πακέτα Τιμών" }
  ];

  return (
    <div className="w-80 bg-black p-8 border-r border-gray-700">
      <div className="mb-8">
        <div className="text-[#00ffba] text-sm font-medium mb-4">ΠΛΗΡΟΦΟΡΙΕΣ ΠΡΟΓΡΑΜΜΑΤΟΣ</div>
        <h1 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Robert, sans-serif' }}>
          Ξεκινήστε
        </h1>
        <h1 className="text-4xl font-bold mb-8" style={{ color: '#00ffba', fontFamily: 'Robert, sans-serif' }}>
          το ταξίδι σας
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
