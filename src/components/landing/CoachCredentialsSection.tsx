import React from 'react';
import credentialsBg from '@/assets/credentials-bg.png';

const CoachCredentialsSection: React.FC = () => {
  return (
    <section className="w-full bg-black">
      <img 
        src={credentialsBg} 
        alt="Coach Credentials"
        className="w-full h-auto"
      />
    </section>
  );
};

export default CoachCredentialsSection;
