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
      <img 
        src={welcomeImage} 
        alt="Welcome to HyperKids" 
        className="w-full h-full object-cover object-center sm:object-contain md:object-cover"
      />
    </div>
  );
};

export default WelcomeScreen;
