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
            price: "€70",
            period: "/μήνα",
            sessions: "4 συνεδρίες το μήνα",
            features: [
              "Εξατομικευμένη προπόνηση",
              "Παρακολούθηση προόδου",
              "Ευέλικτος προγραμματισμός"
            ]
          },
          {
            title: "Τριμηνιαίο",
            price: "€180",
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
            price: "€600",
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
    
    if (program.id === "02") {
      return {
        ages: "8-12 ετών",
        duration: "60 λεπτά",
        frequency: "2 φορές την εβδομάδα",
        schedule: "Τρίτη & Πέμπτη",
        benefits: [
          "Βελτιωμένη αθλητική απόδοση",
          "Ενισχυμένη αποτελεσματικότητα κίνησης",
          "Ανάπτυξη ειδικών αθλητικών δεξιοτήτων",
          "Μειωμένος κίνδυνος τραυματισμού"
        ],
        weeklySchedule: [
          { ageGroup: "Ηλικίες 8-10", day: "Τρίτη", time: "18:00 - 19:00" },
          { ageGroup: "Ηλικίες 8-10", day: "Πέμπτη", time: "18:00 - 19:00" },
          { ageGroup: "Ηλικίες 10-12", day: "Τρίτη", time: "19:00 - 20:00" },
          { ageGroup: "Ηλικίες 10-12", day: "Πέμπτη", time: "19:00 - 20:00" }
        ],
        scheduleNote: "Οι συνεδρίες προγραμματίζονται δύο φορές την εβδομάδα για να εξασφαλιστεί συνεχής πρόοδος και ανάπτυξη δεξιοτήτων. Επικοινωνήστε μαζί μας για εγγραφή και οποιεσδήποτε ερωτήσεις προγραμματισμού.",
        description: "Το πρόγραμμα Ανάπτυξη Κίνησης είναι σχεδιασμένο να παρέχει μια ολοκληρωμένη εμπειρία προπόνησης προσαρμοσμένη στις συγκεκριμένες ανάγκες και στόχους σας. Παρακάτω είναι οι βασικές λεπτομέρειες αυτού του προγράμματος.",
        pricing: [
          {
            title: "Μηνιαίο",
            price: "€90",
            period: "/μήνα",
            sessions: "8 συνεδρίες το μήνα (2 ανά εβδομάδα)",
            features: [
              "Εξατομικευμένη προπόνηση",
              "Παρακολούθηση προόδου",
              "Ευέλικτος προγραμματισμός"
            ]
          },
          {
            title: "Τριμηνιαίο",
            price: "€240",
            period: "/τρίμηνο",
            sessions: "24 συνεδρίες (3 μήνες)",
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
            price: "€950",
            period: "/έτος",
            sessions: "96 συνεδρίες (12 μήνες)",
            savings: "Εξοικονομήστε €130",
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

    if (program.id === "03") {
      return {
        ages: "13-17 ετών",
        duration: "60 λεπτά",
        frequency: "3 φορές την εβδομάδα",
        schedule: "Δευτέρα, Τετάρτη, Παρασκευή",
        benefits: [
          "Αυξημένη δύναμη και ισχύς",
          "Βελτιωμένη σύσταση σώματος",
          "Ενισχυμένη αθλητική απόδοση",
          "Ανάπτυξη σωστών τεχνικών άρσης βαρών"
        ],
        weeklySchedule: [
          { ageGroup: "Ηλικίες 13-17", day: "Δευτέρα", time: "19:00 - 20:00" },
          { ageGroup: "Ηλικίες 13-17", day: "Τετάρτη", time: "19:00 - 20:00" },
          { ageGroup: "Ηλικίες 13-17", day: "Παρασκευή", time: "19:00 - 20:00" }
        ],
        scheduleNote: "Οι συνεδρίες προγραμματίζονται τρεις φορές την εβδομάδα με έμφαση στην εισαγωγή προπόνησης δύναμης, σωστές τεχνικές άρσης βαρών και οικοδόμηση του θεμελίου για αθλητική απόδοση. Επικοινωνήστε μαζί μας για εγγραφή και οποιεσδήποτε ερωτήσεις προγραμματισμού.",
        description: "Το πρόγραμμα Δύναμη Νέων είναι σχεδιασμένο να παρέχει μια ολοκληρωμένη εμπειρία προπόνησης προσαρμοσμένη στις συγκεκριμένες ανάγκες και στόχους σας. Παρακάτω είναι οι βασικές λεπτομέρειες αυτού του προγράμματος.",
        pricing: [
          {
            title: "Μηνιαίο",
            price: "€90",
            period: "/μήνα",
            sessions: "12 συνεδρίες το μήνα (3 ανά εβδομάδα)",
            features: [
              "Εξατομικευμένη προπόνηση",
              "Παρακολούθηση προόδου",
              "Ευέλικτος προγραμματισμός"
            ]
          },
          {
            title: "Τριμηνιαίο",
            price: "€240",
            period: "/τρίμηνο",
            sessions: "36 συνεδρίες (3 μήνες)",
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
            price: "€850",
            period: "/έτος",
            sessions: "144 συνεδρίες (12 μήνες)",
            savings: "Εξοικονομήστε €230",
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

    if (program.id === "04") {
      return {
        ages: "16+ ετών",
        duration: "60-90 λεπτά",
        frequency: "2-5 φορές την εβδομάδα",
        schedule: "Καθημερινά με ραντεβού (7:00 - 20:00)",
        additionalInfo: "Μέγεθος ομάδας: Μέγιστο 6 άτομα, Προσαρμοσμένος σχεδιασμός προγράμματος, Εστίαση: Γενική φυσική κατάσταση, διαχείριση βάρους και συνολική υγεία",
        benefits: [
          "Βελτιωμένη καρδιαγγειακή υγεία",
          "Ενισχυμένη μυϊκή δύναμη και αντοχή",
          "Καλύτερη σύσταση σώματος",
          "Αυξημένη ενέργεια και ζωτικότητα"
        ],
        weeklySchedule: [
          { ageGroup: "Πληροφορίες Προγράμματος", day: "Διαθεσιμότητα: Καθημερινά με ραντεβού", time: "Ώρες: 7:00 - 20:00" }
        ],
        scheduleNote: "Ευέλικτος προγραμματισμός διαθέσιμος για να προσαρμοστεί στις ανάγκες σας. Επικοινωνήστε μαζί μας για εγγραφή και οποιεσδήποτε ερωτήσεις προγραμματισμού.",
        description: "Το πρόγραμμα Φυσική Κατάσταση είναι σχεδιασμένο να παρέχει μια ολοκληρωμένη εμπειρία προπόνησης προσαρμοσμένη στις συγκεκριμένες ανάγκες και στόχους σας. Παρακάτω είναι οι βασικές λεπτομέρειες αυτού του προγράμματος.",
        pricing: [
          {
            title: "Μηνιαίο",
            price: "€110",
            period: "/μήνα",
            sessions: "Ευέλικτες συνεδρίες ανά μήνα",
            features: [
              "Εξατομικευμένη προπόνηση",
              "Παρακολούθηση προόδου",
              "Ευέλικτος προγραμματισμός"
            ]
          },
          {
            title: "Τριμηνιαίο",
            price: "€300",
            period: "/τρίμηνο",
            sessions: "Πρόσβαση 3 μηνών",
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
            price: "€1050",
            period: "/έτος",
            sessions: "Πρόσβαση 12 μηνών",
            savings: "Εξοικονομήστε €270",
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

    if (program.id === "05") {
      return {
        ages: "16+ ετών",
        duration: "90 λεπτά",
        frequency: "5 φορές την εβδομάδα",
        schedule: "Δευτέρα έως Παρασκευή στις 20:00-21:30",
        additionalInfo: "Εστίαση: Τεχνικές χτυπήματος, φυσική κατάσταση και ψυχική αντοχή",
        benefits: [
          "Βελτιωμένες δεξιότητες χτυπήματος",
          "Ενισχυμένη καρδιαγγειακή προετοιμασία",
          "Αυξημένη ψυχική αντοχή",
          "Ανάπτυξη ικανοτήτων αυτοάμυνας"
        ],
        weeklySchedule: [
          { ageGroup: "Ηλικίες 16+", day: "Δευτέρα έως Παρασκευή", time: "20:00 - 21:30" }
        ],
        scheduleNote: "Οι συνεδρίες προγραμματίζονται πέντε φορές την εβδομάδα για να εξασφαλιστεί συνεχής πρόοδος και ανάπτυξη δεξιοτήτων. Επικοινωνήστε μαζί μας για εγγραφή και οποιεσδήποτε ερωτήσεις προγραμματισμού.",
        description: "Το πρόγραμμα Muay Thai είναι σχεδιασμένο να παρέχει μια ολοκληρωμένη εμπειρία προπόνησης προσαρμοσμένη στις συγκεκριμένες ανάγκες και στόχους σας. Παρακάτω είναι οι βασικές λεπτομέρειες αυτού του προγράμματος.",
        pricing: [
          {
            title: "Μηνιαίο",
            price: "€70",
            period: "/μήνα",
            sessions: "20 συνεδρίες το μήνα (5 ανά εβδομάδα)",
            features: [
              "Εξατομικευμένη προπόνηση",
              "Παρακολούθηση προόδου",
              "Ευέλικτος προγραμματισμός"
            ]
          },
          {
            title: "Τριμηνιαίο",
            price: "€270",
            period: "/τρίμηνο",
            sessions: "60 συνεδρίες (3 μήνες) + προπόνηση με βάρη",
            savings: "Περιλαμβάνει προπόνηση με βάρη",
            popular: true,
            features: [
              "Εξατομικευμένη προπόνηση",
              "Παρακολούθηση προόδου",
              "Ευέλικτος προγραμματισμός",
              "Προπόνηση με βάρη περιλαμβάνεται"
            ]
          },
          {
            title: "Ετήσιο",
            price: "€850",
            period: "/έτος",
            sessions: "240 συνεδρίες (12 μήνες) + επαγγελματικές δραστηριότητες μάχης",
            savings: "Περιλαμβάνει επαγγελματικές δραστηριότητες μάχης περιλαμβάνονται",
            features: [
              "Εξατομικευμένη προπόνηση",
              "Παρακολούθηση προόδου",
              "Ευέλικτος προγραμματισμός",
              "Επαγγελματικές δραστηριότητες μάχης περιλαμβάνονται",
              "Δωρεάν αξιολόγηση"
            ]
          }
        ]
      };
    }

    if (program.id === "06") {
      return {
        ages: "Όλες οι ηλικίες",
        duration: "60 λεπτά",
        frequency: "Με βάση τις ατομικές ανάγκες",
        schedule: "Καθημερινά με ραντεβού (7:00 - 20:00)",
        additionalInfo: "Εστίαση: Εξατομικευμένη προπόνηση και προσαρμοσμένος προγραμματισμός",
        benefits: [
          "Εξατομικευμένη προσοχή",
          "Προσαρμοσμένος προγραμματισμός",
          "Λεπτομερής ανατροφοδότηση και καθοδήγηση",
          "Επιταχυνόμενη πρόοδος προς τους στόχους"
        ],
        weeklySchedule: [
          { ageGroup: "Πληροφορίες Προγράμματος", day: "Διαθεσιμότητα: Καθημερινά με ραντεβού", time: "Ώρες: 7:00 - 20:00" }
        ],
        scheduleNote: "Ευέλικτος προγραμματισμός διαθέσιμος για να προσαρμοστεί στις ανάγκες σας. Επικοινωνήστε μαζί μας για εγγραφή και οποιεσδήποτε ερωτήσεις προγραμματισμού.",
        description: "Το πρόγραμμα Προπόνηση Ένας προς Έναν είναι σχεδιασμένο να παρέχει μια ολοκληρωμένη εμπειρία προπόνησης προσαρμοσμένη στις συγκεκριμένες ανάγκες και στόχους σας. Παρακάτω είναι οι βασικές λεπτομέρειες αυτού του προγράμματος.",
        pricing: [
          {
            title: "Συνεδρία",
            price: "€30",
            period: "/συνεδρία",
            sessions: "Κράτηση μεμονωμένης συνεδρίας",
            features: [
              "Εξατομικευμένη προπόνηση",
              "Παρακολούθηση προόδου",
              "Ευέλικτος προγραμματισμός"
            ]
          },
          {
            title: "12 Συνεδρίες",
            price: "€25",
            period: "/συνεδρία",
            sessions: "Πακέτο 12 συνεδριών",
            savings: "Εξοικονομήστε €5 ανά συνεδρία",
            popular: true,
            features: [
              "Εξατομικευμένη προπόνηση",
              "Παρακολούθηση προόδου",
              "Ευέλικτος προγραμματισμός",
              "Προτεραιότητα κράτησης"
            ]
          },
          {
            title: "24 Συνεδρίες",
            price: "€20",
            period: "/συνεδρία",
            sessions: "Πακέτο 24 συνεδριών",
            savings: "Εξοικονομήστε €10 ανά συνεδρία",
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

    if (program.id === "07") {
      return {
        ages: "16+ ετών",
        duration: "90-120 λεπτά",
        frequency: "3-5 φορές την εβδομάδα",
        schedule: "Καθημερινά με ραντεβού (7:00 - 20:00)",
        additionalInfo: "Εστίαση: Βελτιωμένη απόδοση ειδικά για το άθλημα, ενισχυμένη δύναμη, ισχύς και ταχύτητα, βελτιστοποιημένη ανάκαμψη και πρόληψη τραυματισμών, παρακολούθηση απόδοσης και ανατροφοδότηση",
        benefits: [
          "Βελτιωμένη απόδοση ειδικά για το άθλημα",
          "Ενισχυμένη δύναμη, ισχύς και ταχύτητα",
          "Βελτιστοποιημένη ανάκαμψη και πρόληψη τραυματισμών",
          "Παρακολούθηση απόδοσης και ανατροφοδότηση"
        ],
        weeklySchedule: [
          { ageGroup: "Πληροφορίες Προγράμματος", day: "Διαθεσιμότητα: Καθημερινά με ραντεβού", time: "Ώρες: 7:00 - 20:00" }
        ],
        scheduleNote: "Ευέλικτος προγραμματισμός διαθέσιμος για να προσαρμοστεί στις ανάγκες σας. Επικοινωνήστε μαζί μας για εγγραφή και οποιεσδήποτε ερωτήσεις προγραμματισμού.",
        description: "Το πρόγραμμα Απόδοση Αθλητών είναι σχεδιασμένο να παρέχει μια ολοκληρωμένη εμπειρία προπόνησης προσαρμοσμένη στις συγκεκριμένες ανάγκες και στόχους σας. Παρακάτω είναι οι βασικές λεπτομέρειες αυτού του προγράμματος.",
        pricing: [
          {
            title: "Μηνιαίο",
            price: "€150",
            period: "/μήνα",
            sessions: "24 συνεδρίες το μήνα",
            features: [
              "Εξατομικευμένη προπόνηση",
              "Παρακολούθηση προόδου",
              "Ευέλικτος προγραμματισμός"
            ]
          },
          {
            title: "Τριμηνιαίο",
            price: "€400",
            period: "/τρίμηνο",
            sessions: "72 συνεδρίες (3 μήνες)",
            savings: "Εξοικονομήστε €50",
            popular: true,
            features: [
              "Εξατομικευμένη προπόνηση",
              "Παρακολούθηση προόδου",
              "Ευέλικτος προγραμματισμός",
              "Πρόγραμμα διατροφής περιλαμβάνεται"
            ]
          },
          {
            title: "Ετήσιο",
            price: "€1450",
            period: "/έτος",
            sessions: "288 συνεδρίες (12 μήνες)",
            savings: "Εξοικονομήστε €350",
            features: [
              "Εξατομικευμένη προπόνηση",
              "Παρακολούθηση προόδου",
              "Ευέλικτος προγραμματισμός",
              "Πρόγραμμα διατροφής περιλαμβάνεται",
              "Φυσιοθεραπεία περιλαμβάνεται",
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
                    {program.id === "01" ? "Εισαγωγικές Τεχνικές Κίνησης" : 
                     program.id === "02" ? "Χτίζοντας αθλητικές βάσεις για όλα τα σπορ" :
                     program.id === "03" ? "Εισαγωγή στην προπόνηση δύναμης για εφήβους" :
                     program.id === "04" ? "Ολοκληρωμένη προσέγγιση για υγεία και ευεξία" : 
                     program.id === "05" ? "Τεχνικές χτυπήματος, φυσική κατάσταση και ψυχική αντοχή" :
                     program.id === "06" ? "Εξατομικευμένη προπόνηση και προσαρμοσμένος προγραμματισμός" :
                     program.id === "07" ? "Βελτιωμένη απόδοση ειδικά για το άθλημα" :
                     "Εισαγωγικές Τεχνικές Κίνησης"}
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

            {programData.additionalInfo && (
              <div className="bg-gray-800 p-6 rounded-none border border-gray-700 mb-8">
                <h4 className="text-[#00ffba] font-bold mb-2">Επιπλέον Πληροφορίες</h4>
                <p className="text-white">{programData.additionalInfo}</p>
              </div>
            )}
            
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
