
import React from 'react';

interface ProgramDetailsSidebarProps {
  onClose: () => void;
}

export const ProgramDetailsSidebar: React.FC<ProgramDetailsSidebarProps> = ({ onClose }) => {
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
        <div className="flex items-center gap-4">
          <span className="text-[#00ffba] text-xl font-bold">01</span>
          <span className="text-white font-medium border-b border-[#00ffba] pb-1">Program Details</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-xl font-bold">02</span>
          <span className="text-gray-500 font-medium">Program Benefits</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-xl font-bold">03</span>
          <span className="text-gray-500 font-medium">Weekly Schedule</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-xl font-bold">04</span>
          <span className="text-gray-500 font-medium">Pricing Plans</span>
        </div>
      </nav>
    </div>
  );
};
