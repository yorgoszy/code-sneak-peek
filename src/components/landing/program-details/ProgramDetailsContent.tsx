
import React from 'react';
import { X } from 'lucide-react';
import { ProgramPricingCard } from './ProgramPricingCard';
import { ProgramBenefitsSection } from './ProgramBenefitsSection';
import { ProgramScheduleSection } from './ProgramScheduleSection';

interface Program {
  id: string;
  title: string;
  description: string;
  image: string;
  color: string;
}

interface ProgramDetailsContentProps {
  program: Program;
  onClose: () => void;
  activeSection: number;
}

export const ProgramDetailsContent: React.FC<ProgramDetailsContentProps> = ({
  program,
  onClose,
  activeSection
}) => {
  // Δεδομένα ανάλογα με το πρόγραμμα
  const getProgramData = () => {
    if (program.id === "01") {
      return {
        ages: "4-8 ετών",
        duration: "45 λεπτά",
        frequency: "1 φορά την εβδομάδα",
        schedule: "Τετάρτη",
        benefits: [
          "Ανάπτυξη βασικών κινητικών δεξιοτήτων και συντονισμού",
          "Εκμάθηση ρυθμού και χρονισμού στα πρότυπα κίνησης",
          "Οικοδόμηση συνεργασίας και ομαδικότητας",
          "Καθιέρωση καλών προτύπων συμπεριφοράς και πειθαρχίας"
        ],
        weeklySchedule: [
          { ageGroup: "Ηλικίες 4-6", day: "Τετάρτη", time: "17:15 - 18:00" },
          { ageGroup: "Ηλικίες 6-8", day: "Τετάρτη", time: "18:15 - 19:00" }
        ],
        scheduleNote: "Οι συνεδρίες προγραμματίζονται μία φορά την εβδομάδα για να αποφευχθεί η κόπωση και να διατηρηθούν τα παιδιά ενεργά και παρακινημένα. Επικοινωνήστε μαζί μας για εγγραφή και οποιεσδήποτε ερωτήσεις προγραμματισμού.",
        description: "Το πρόγραμμα Εκμάθηση Κίνησης είναι σχεδιασμένο να παρέχει μια ολοκληρωμένη εμπειρία προπόνησης προσαρμοσμένη στις συγκεκριμένες ανάγκες και στόχους σας. Παρακάτω είναι οι βασικές λεπτομέρειες αυτού του προγράμματος.",
        pricing: [
          {
            title: "Μηνιαίο",
            price: "€50",
            period: "/μήνα",
            sessions: "4 συνεδρίες το μήνα (1 ανά εβδομάδα)",
            features: [
              "Εξατομικευμένη προπόνηση",
              "Παρακολούθηση προόδου",
              "Ευέλικτος προγραμματισμός"
            ]
          },
          {
            title: "Τριμηνιαίο",
            price: "€120",
            period: "/τρίμηνο",
            sessions: "12 συνεδρίες (3 μήνες)",
            savings: "Εξοικονομήστε €30",
            popular: true,
            features: [
              "Εξατομικευμένη προπόνηση",
              "Παρακολούθηση προόδου",
              "Ευέλικτος προγραμματισμός",
              "Προτεραιότητα κράτησης"
            ]
          },
          {
            title: "Ετήσιο",
            price: "€360",
            period: "/έτος",
            sessions: "48 συνεδρίες (12 μήνες)",
            savings: "Εξοικονομήστε €240",
            features: [
              "Εξατομικευμένη προπόνηση",
              "Παρακολούθηση προόδου",
              "Ευέλικτος προγραμματισμός",
              "Προτεραιότητα κράτησης",
              "Δωρεάν αξιολόγηση"
            ]
          }
        ]
      };
    }
    
    // Default data για άλλα προγράμματα
    return {
      ages: "6-16 years old / 6-16 ετών",
      duration: "60 minutes / 60 λεπτά",
      frequency: "2-3 times per week / 2-3 φορές την εβδομάδα",
      schedule: "Flexible scheduling / Ευέλικτο πρόγραμμα",
      benefits: [
        "Develops fundamental movement patterns / Αναπτύσσει βασικά κινητικά πρότυπα",
        "Improves coordination and balance / Βελτιώνει τον συντονισμό και την ισορροπία",
        "Builds confidence in physical activities / Χτίζει αυτοπεποίθηση στις φυσικές δραστηριότητες",
        "Enhances cognitive development / Ενισχύει την γνωστική ανάπτυξη",
        "Promotes social interaction / Προωθεί την κοινωνική αλληλεπίδραση",
        "Establishes healthy habits early / Δημιουργεί υγιείς συνήθειες από νωρίς"
      ],
      weeklySchedule: [
        { ageGroup: "Ages 6-9 / Ηλικίες 6-9", day: "Monday & Wednesday / Δευτέρα & Τετάρτη", time: "4:00 PM - 5:00 PM" },
        { ageGroup: "Ages 10-13 / Ηλικίες 10-13", day: "Tuesday & Thursday / Τρίτη & Πέμπτη", time: "4:30 PM - 5:30 PM" },
        { ageGroup: "Ages 14-16 / Ηλικίες 14-16", day: "Monday & Friday / Δευτέρα & Παρασκευή", time: "5:30 PM - 6:30 PM" }
      ],
      scheduleNote: "All times are flexible and can be adjusted based on availability. / Όλες οι ώρες είναι ευέλικτες και μπορούν να προσαρμοστούν ανάλογα με τη διαθεσιμότητα.",
      description: "Movement Learning is designed to help children develop fundamental movement skills through structured play and activities. Our program focuses on building coordination, balance, and confidence while making physical activity enjoyable and engaging.",
      pricing: [
        {
          title: "Monthly Package / Μηνιαίο Πακέτο",
          price: "€80",
          period: "per month / ανά μήνα",
          sessions: "8 sessions / 8 συνεδρίες",
          features: [
            "2 sessions per week / 2 συνεδρίες την εβδομάδα",
            "Professional coaching / Επαγγελματική καθοδήγηση",
            "Progress tracking / Παρακολούθηση προόδου",
            "Equipment included / Εξοπλισμός συμπεριλαμβάνεται"
          ]
        },
        {
          title: "3-Month Package / 3μηνο Πακέτο",
          price: "€210",
          period: "3 months / 3 μήνες",
          sessions: "24 sessions / 24 συνεδρίες",
          savings: "Save €30 / Εξοικονόμηση €30",
          popular: true,
          features: [
            "All monthly features / Όλα τα μηνιαία χαρακτηριστικά",
            "Free assessment / Δωρεάν αξιολόγηση",
            "Nutrition guidance / Διατροφικές οδηγίες",
            "Parent consultation / Συμβουλευτική γονέων"
          ]
        },
        {
          title: "6-Month Package / 6μηνο Πακέτο",
          price: "€400",
          period: "6 months / 6 μήνες",
          sessions: "48 sessions / 48 συνεδρίες",
          savings: "Save €80 / Εξοικονόμηση €80",
          features: [
            "All 3-month features / Όλα τα 3μηνα χαρακτηριστικά",
            "Quarterly assessments / Τριμηνιαίες αξιολογήσεις",
            "Home exercise program / Πρόγραμμα ασκήσεων σπιτιού",
            "Priority booking / Προτεραιότητα κράτησης"
          ]
        }
      ]
    };
  };

  const programData = getProgramData();

  const renderSection = () => {
    switch (activeSection) {
      case 1:
        return (
          <div className="mb-12">
            <div className="relative h-80 mb-8 rounded-none overflow-hidden">
              <img 
                src={program.image}
                alt={program.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-5xl font-bold text-white mb-4 border-b-4 border-[#00ffba] pb-2 inline-block" style={{ fontFamily: 'Robert, sans-serif' }}>
                    {program.title}
                  </h2>
                  <p className="text-[#00ffba] text-lg font-semibold">
                    {program.id === "01" ? "Εισαγωγικές Τεχνικές Κίνησης" : "Εισαγωγικές Τεχνικές Κίνησης"}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-800 p-6 rounded-none border border-gray-700">
                <h4 className="text-[#00ffba] font-bold mb-2">Ηλικιακή Ομάδα</h4>
                <p className="text-white">{programData.ages}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-none border border-gray-700">
                <h4 className="text-[#00ffba] font-bold mb-2">Διάρκεια</h4>
                <p className="text-white">{programData.duration}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-none border border-gray-700">
                <h4 className="text-[#00ffba] font-bold mb-2">Συχνότητα</h4>
                <p className="text-white">{programData.frequency}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-none border border-gray-700">
                <h4 className="text-[#00ffba] font-bold mb-2">Πρόγραμμα</h4>
                <p className="text-white">{programData.schedule}</p>
              </div>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-none border border-[#00ffba]">
              <h4 className="text-[#00ffba] font-bold mb-4">Περιγραφή Προγράμματος</h4>
              <p className="text-gray-300 leading-relaxed">
                {programData.description}
              </p>
            </div>
          </div>
        );
      case 2:
        return <ProgramBenefitsSection benefits={programData.benefits} />;
      case 3:
        return (
          <ProgramScheduleSection 
            weeklySchedule={programData.weeklySchedule}
            scheduleNote={programData.scheduleNote}
            shouldShow={true}
          />
        );
      case 4:
        return (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-white mb-6">Πακέτα Τιμών</h3>
            <p className="text-gray-300 mb-8">
              Επιλέξτε το πακέτο που ταιριάζει καλύτερα στους στόχους προπόνησης και το πρόγραμμά σας. 
              Όλα τα πακέτα περιλαμβάνουν επαγγελματική καθοδήγηση και παρακολούθηση προόδου.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {programData.pricing.map((plan, index) => (
                <ProgramPricingCard key={index} plan={plan} />
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 bg-black text-white p-8 overflow-y-auto">
      <div className="flex justify-end mb-6">
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {renderSection()}
    </div>
  );
};
