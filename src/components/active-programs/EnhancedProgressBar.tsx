
import React from 'react';

interface EnhancedProgressBarProps {
  completed: number;
  total: number;
  missed: number;
  className?: string;
}

export const EnhancedProgressBar: React.FC<EnhancedProgressBarProps> = ({
  completed,
  total,
  missed,
  className = ""
}) => {
  if (total === 0) return null;

  const completedPercentage = (completed / total) * 100;
  const missedPercentage = (missed / total) * 100;
  const remainingPercentage = 100 - completedPercentage - missedPercentage;

  return (
    <div className={`relative h-1 w-full overflow-hidden rounded-none bg-gray-200 ${className}`}>
      {/* Completed part - Green */}
      <div 
        className="absolute left-0 top-0 h-full bg-[#00ffba] transition-all duration-300"
        style={{ width: `${completedPercentage}%` }}
      />
      
      {/* Missed part - Red */}
      <div 
        className="absolute top-0 h-full bg-red-500 transition-all duration-300"
        style={{ 
          left: `${completedPercentage}%`, 
          width: `${missedPercentage}%` 
        }}
      />
      
      {/* Remaining part - Blue */}
      <div 
        className="absolute top-0 h-full bg-blue-500 transition-all duration-300"
        style={{ 
          left: `${completedPercentage + missedPercentage}%`, 
          width: `${remainingPercentage}%` 
        }}
      />
    </div>
  );
};
