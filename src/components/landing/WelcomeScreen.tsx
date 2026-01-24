import React, { useEffect, useState } from 'react';
import welcomeImage from '@/assets/welcome-screen.svg';

const WelcomeScreen: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center transition-opacity duration-500"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      {/* Desktop */}
      <div 
        className="hidden md:block absolute inset-0 bg-center bg-cover bg-no-repeat"
        style={{ backgroundImage: `url(${welcomeImage})` }}
      />
      {/* Mobile - scale to fill height */}
      <div 
        className="md:hidden absolute inset-0 flex items-center justify-center overflow-hidden"
      >
        <img 
          src={welcomeImage} 
          alt="Welcome to HyperKids" 
          className="min-w-full min-h-full object-cover"
        />
      </div>
    </div>
  );
};

export default WelcomeScreen;
