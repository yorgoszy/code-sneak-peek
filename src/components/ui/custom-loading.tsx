
import React from 'react';

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
          src="/lovable-uploads/f05b81f1-65f9-41ad-b5c2-fba7df510ab8.png" 
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
