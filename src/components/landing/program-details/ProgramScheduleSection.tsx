
import React from 'react';
import { Calendar } from "lucide-react";

interface ScheduleItem {
  ageGroup: string;
  day: string;
  time: string;
}

interface ProgramScheduleSectionProps {
  weeklySchedule: ScheduleItem[];
  scheduleNote: string;
  shouldShow: boolean;
}

export const ProgramScheduleSection: React.FC<ProgramScheduleSectionProps> = ({ 
  weeklySchedule, 
  scheduleNote, 
  shouldShow 
}) => {
  if (!shouldShow) return null;

  return (
    <div className="mb-12">
      <h3 className="text-2xl font-bold text-white mb-6">Εβδομαδιαίο Πρόγραμμα</h3>
      <p className="text-gray-300 mb-6">
        Το πρόγραμμά μας προσφέρει ευέλικτο προγραμματισμό για να προσαρμοστεί στον πολυάσχολο τρόπο ζωής σας.
      </p>
      
      <div className="bg-gray-800 p-6 rounded-none border border-[#00ffba] mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-[#00ffba]" />
          <span className="text-[#00ffba] font-medium">Εβδομαδιαίο Πρόγραμμα</span>
        </div>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          {weeklySchedule.map((schedule, index) => (
            <div key={index} className="bg-gray-700 p-4 rounded-none">
              <div className="text-white font-medium mb-2">{schedule.ageGroup}</div>
              <div className="text-gray-300 text-sm mb-1">{schedule.day}</div>
              <div className="text-[#00ffba] font-bold">{schedule.time}</div>
            </div>
          ))}
        </div>
        
        <div className="text-gray-300 text-sm">
          <strong>Σημείωση:</strong> {scheduleNote}
        </div>
      </div>
    </div>
  );
};
