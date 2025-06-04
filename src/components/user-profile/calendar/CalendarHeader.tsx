
import React from 'react';

interface CalendarHeaderProps {
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  onPreviousMonth,
  onNextMonth
}) => {
  return (
    <div className="flex flex-row items-center justify-between space-y-0 pb-1">
      <h2 className="text-sm font-bold text-white">
        {new Intl.DateTimeFormat('el-GR', { month: 'long', year: 'numeric' }).format(currentDate)}
      </h2>
      <div className="flex space-x-1">
        <button
          onClick={onPreviousMonth}
          className="w-5 h-5 rounded-none border border-gray-600 bg-gray-800 text-white hover:bg-[#00ffba] hover:text-black flex items-center justify-center text-xs"
        >
          ‹
        </button>
        <button
          onClick={onNextMonth}
          className="w-5 h-5 rounded-none border border-gray-600 bg-gray-800 text-white hover:bg-[#00ffba] hover:text-black flex items-center justify-center text-xs"
        >
          ›
        </button>
      </div>
    </div>
  );
};
