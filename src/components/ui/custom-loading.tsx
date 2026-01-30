
import React from 'react';
import loadingLogo from '@/assets/loading-logo.png';

interface CustomLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CustomLoading: React.FC<CustomLoadingProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} animate-pulse`}>
        <img 
          src={loadingLogo} 
          alt="Loading..." 
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
};

export const CustomLoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <CustomLoading size="lg" />
        <p className="mt-4 text-gray-600 text-sm">Φόρτωση...</p>
      </div>
    </div>
  );
};
