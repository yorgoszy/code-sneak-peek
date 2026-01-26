import React from 'react';

const PlanningSection: React.FC = () => {
  return (
    <section className="relative bg-black min-h-[700px]">
      {/* Text content - right side */}
      <div 
        className="absolute z-10"
        style={{ 
          left: '1200px', 
          top: '300px'
        }}
      >
        <p 
          style={{ 
            fontFamily: "'Roobert Pro', sans-serif",
            fontSize: '15px',
            color: '#9fa0a4',
            maxWidth: '320px',
            lineHeight: '1.6'
          }}
        >
          Για να δημιουργηθεί ένας πραγματικός<br />
          αθλητής, η θέληση είναι μόνο η αφετηρία.<br />
          Το μυστικό όπλο κάθε πρωταθλητή είναι
        </p>
        
        <h2 
          className="text-white my-6"
          style={{ 
            fontFamily: "'Roobert Pro', sans-serif",
            fontSize: '34px'
          }}
        >
          η σωστή καθοδήγηση<br />
          του προπονητή.
        </h2>
        
        <p 
          style={{ 
            fontFamily: "'Roobert Pro', sans-serif",
            fontSize: '15px',
            color: '#9fa0a4'
          }}
        >
          Χτίζουμε πρωταθλητές με αξίες
        </p>
      </div>

      {/* Bottom gradient */}
      <div 
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent"
        style={{ height: '150px' }}
      />
    </section>
  );
};

export default PlanningSection;
