import React from 'react';

const PlanningSection: React.FC = () => {
  return (
    <section className="relative bg-black min-h-[700px]">
      {/* Text content - right side */}
      <div className="absolute z-10" style={{ left: '1200px', top: '402px' }}>
        <h2 
          className="text-white font-robert mb-6"
          style={{ fontSize: '34px' }}
        >
          Χτίζουμε πρωταθλητές με αξίες
        </h2>
        <p 
          className="font-robert leading-relaxed"
          style={{ fontSize: '15px', color: '#9fa0a4', maxWidth: '400px' }}
        >
          Για να δημιουργηθεί ένας πραγματικός αθλητής,
          <br />
          η θέληση είναι μόνο η αφετηρία. Το μυστικό
          <br />
          όπλο κάθε πρωταθλητή είναι η σωστή
          <br />
          καθοδήγηση του προπονητή.
        </p>
      </div>
    </section>
  );
};

export default PlanningSection;
