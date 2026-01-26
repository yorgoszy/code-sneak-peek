import React from 'react';
import trainingFighters from '@/assets/training-fighters.png';
import trainingLogo from '@/assets/training-logo.png';

const TrainingSection: React.FC = () => {
  return (
    <section className="relative bg-black min-h-[900px]">
      {/* Vertical line with "road to" text in the middle */}
      <div 
        className="absolute flex flex-col items-center"
        style={{ 
          left: '1370px',
          top: '0px',
          transform: 'translateX(-50%)'
        }}
      >
        {/* Top line segment */}
        <div 
          className="bg-white"
          style={{ 
            width: '2px',
            height: '70px'
          }}
        />
        {/* Text */}
        <span 
          className="text-white py-2"
          style={{ 
            fontFamily: 'UnifrakturMaguntia, cursive',
            fontSize: '34px'
          }}
        >
          road to
        </span>
        {/* Bottom line segment */}
        <div 
          className="bg-white"
          style={{ 
            width: '2px',
            height: '70px'
          }}
        />
      </div>
      
      {/* Text content - mirroring section #2 style but on the left */}
      <div 
        className="absolute z-10"
        style={{ 
          left: '200px', 
          top: '402px'
        }}
      >
        <h2 
          className="text-white mb-4"
          style={{ 
            fontFamily: "'Roobert Pro', sans-serif",
            fontSize: '34px'
          }}
        >
          Δεν προπονούμε τυχαία
        </h2>
        <p 
          style={{ 
            fontFamily: "'Roobert Pro', sans-serif",
            fontSize: '15px',
            color: '#9fa0a4',
            maxWidth: '320px',
            lineHeight: '1.6'
          }}
        >
          Στο γυμναστήριό μας δεν διδάσκουμε απλά<br />
          ένα άθλημα - Επενδύουμε στη συνολική<br />
          ανάπτυξη του παιδιού, καλλιεργώντας<br />
          τη συναισθηματική του νοημοσύνη,<br />
          τις κινητικές του ικανότητες και τις<br />
          κοινωνικές του δεξιότητες. Στόχος μας<br />
          να τους δώσουμε τα εφόδια που θα τους<br />
          συνοδεύουν σε όλη τους τη ζωή.
        </p>
      </div>
      
      {/* Grouped: Fighters image + Logo */}
      <div 
        className="absolute"
        style={{ 
          left: '1089px', 
          top: '364px'
        }}
      >
        {/* Fighters image */}
        <div className="relative">
          <img 
            src={trainingFighters} 
            alt="Fighters Training" 
            className="w-auto object-contain opacity-60"
            style={{ height: '550px' }}
          />
          {/* Intense bottom gradient */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent"
            style={{ height: '150px' }}
          />
        </div>
        
        {/* Logo - positioned relative to the group (offset 120px from left, 486px from top of image) */}
        <div 
          className="absolute z-10"
          style={{ 
            left: '120px',
            top: '486px'
          }}
        >
          <img 
            src={trainingLogo} 
            alt="Athletes Logo" 
            style={{ width: '130px' }}
          />
        </div>
      </div>

      {/* Bottom gradient for section */}
      <div 
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent"
        style={{ height: '150px' }}
      />
    </section>
  );
};

export default TrainingSection;
