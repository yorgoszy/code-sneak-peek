import React from 'react';
import credentialsBg from '@/assets/credentials-bg.png';

const CoachCredentialsSection: React.FC = () => {
  return (
    <section 
      className="relative w-full min-h-screen bg-black"
      style={{
        backgroundImage: `url(${credentialsBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Content container - currently using image as-is */}
      <div className="absolute inset-0" />
    </section>
  );
};

export default CoachCredentialsSection;
