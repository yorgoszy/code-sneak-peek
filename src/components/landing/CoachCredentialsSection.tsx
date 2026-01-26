import React from 'react';

const CoachCredentialsSection: React.FC = () => {
  return (
    <section className="py-20 lg:py-32 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl space-y-16">
          {/* Ακαδημαϊκό υπόβαθρο */}
          <div className="space-y-4">
            <h3 className="text-3xl lg:text-4xl font-bold text-white">
              Ακαδημαϊκό υπόβαθρο
            </h3>
            <p 
              className="text-sm lg:text-base uppercase tracking-widest leading-relaxed"
              style={{ color: '#aca097' }}
            >
              Απόφοιτος της Σχολής Φυσικής Αγωγής και<br />
              Αθλητισμού του Αριστοτελείου<br />
              Πανεπιστημίου Θεσσαλονίκης (2023)
            </p>
          </div>

          {/* Αθλητική εμπηρία */}
          <div className="space-y-4">
            <h3 className="text-3xl lg:text-4xl font-bold text-white">
              Αθλητική εμπηρία
            </h3>
            <p 
              className="text-sm lg:text-base leading-relaxed"
              style={{ color: '#aca097' }}
            >
              Επαγγελματίας αθλητής Muay Thai με πολυετή εμπειρία σε<br />
              αγώνες υψηλού επιπέδου
            </p>
          </div>

          {/* Βασικές αξίες */}
          <div className="space-y-4">
            <h3 className="text-3xl lg:text-4xl font-bold text-white">
              Βασικές αξίες
            </h3>
            <p 
              className="text-sm lg:text-base leading-relaxed"
              style={{ color: '#aca097' }}
            >
              Ο στόχος μας δεν είναι μόνο η σωματική βελτίωση, αλλά και<br />
              η καλλιέργεια αυτοπεποίθησης, χαρακτήρα και βασικών<br />
              αξιών
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoachCredentialsSection;
