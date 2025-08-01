import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgramBenefitsSection } from './program-details/ProgramBenefitsSection';
import { ProgramScheduleSection } from './program-details/ProgramScheduleSection';

interface Program {
  id: string;
  title: string;
  description: string;
  image: string;
  color: string;
}

interface ProgramCardProps {
  program: Program;
}

export const ProgramCard: React.FC<ProgramCardProps> = ({ program }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const hyperkidsImages = [
    "/lovable-uploads/588f9e4c-7c09-485d-b4f3-03d2d3ca6e99.png",
    "/lovable-uploads/d927ce71-2cdb-4230-a8b4-83723f860a48.png", 
    "/lovable-uploads/2594ec01-4721-4092-8051-4eb45b419aec.png"
  ];

  useEffect(() => {
    if (program.id === "10") {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % hyperkidsImages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [program.id, hyperkidsImages.length]);
  // Δεδομένα ανάλογα με το πρόγραμμα
  const getProgramData = () => {
    if (program.id === "01") {
      return {
        ages: "4-8 ετών",
        duration: "45 λεπτά",
        frequency: "1 φορά την εβδομάδα",
        schedule: "Τετάρτη",
        monthlyPrice: "50€",
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
        description: "Το πρόγραμμα Εκμάθηση Κίνησης είναι σχεδιασμένο να παρέχει μια ολοκληρωμένη εμπειρία προπόνησης προσαρμοσμένη στις συγκεκριμένες ανάγκες και στόχους σας. Παρακάτω είναι οι βασικές λεπτομέρειες αυτού του προγράμματος."
      };
    }
    
    if (program.id === "02") {
      return {
        ages: "8-12 ετών",
        duration: "60 λεπτά",
        frequency: "2 φορές την εβδομάδα",
        schedule: "Τρίτη & Πέμπτη",
        monthlyPrice: "70€",
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
        description: "Το πρόγραμμα Ανάπτυξη Κίνησης είναι σχεδιασμένο να παρέχει μια ολοκληρωμένη εμπειρία προπόνησης προσαρμοσμένη στις συγκεκριμένες ανάγκες και στόχους σας. Παρακάτω είναι οι βασικές λεπτομέρειες αυτού του προγράμματος."
      };
    }

    if (program.id === "03") {
      return {
        ages: "13-17 ετών",
        duration: "60 λεπτά",
        frequency: "3 φορές την εβδομάδα",
        schedule: "Δευτέρα, Τετάρτη, Παρασκευή",
        monthlyPrice: "90€",
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
        description: "Το πρόγραμμα Δύναμη Νέων είναι σχεδιασμένο να παρέχει μια ολοκληρωμένη εμπειρία προπόνησης προσαρμοσμένη στις συγκεκριμένες ανάγκες και στόχους σας. Παρακάτω είναι οι βασικές λεπτομέρειες αυτού του προγράμματος."
      };
    }

    if (program.id === "04") {
      return {
        ages: "18+ ετών",
        duration: "60 λεπτά",
        frequency: "3-5 φορές την εβδομάδα",
        schedule: "Καθημερινά",
        monthlyPrice: "120€",
        benefits: [
          "Βελτιωμένη καρδιαγγειακή υγεία",
          "Ενισχυμένη μυϊκή δύναμη και αντοχή",
          "Καλύτερη σύσταση σώματος",
          "Αυξημένη ενέργεια και ζωτικότητα"
        ],
        weeklySchedule: [
          { ageGroup: "Φυσική Κατάσταση", day: "Καθημερινά", time: "Πρωί & Απόγευμα" }
        ],
        scheduleNote: "Ευέλικτος προγραμματισμός διαθέσιμος για να προσαρμοστεί στις ανάγκες σας. Επικοινωνήστε μαζί μας για εγγραφή και οποιεσδήποτε ερωτήσεις προγραμματισμού.",
        description: "Το πρόγραμμα Φυσική Κατάσταση είναι σχεδιασμένο να παρέχει μια ολοκληρωμένη εμπειρία προπόνησης για βελτίωση της συνολικής φυσικής κατάστασης."
      };
    }

    if (program.id === "05") {
      return {
        ages: "16+ ετών",
        duration: "90 λεπτά",
        frequency: "5 φορές την εβδομάδα",
        schedule: "Καθημερινά",
        monthlyPrice: "70€",
        benefits: [
          "Αυξημένη αυτοπεποίθηση",
          "Βελτιωμένη καρδιαγγειακή υγεία",
          "Βελτιωμένος τρόπος σκέψης",
          "Ενισχυμένη μυϊκή δύναμη και αντοχή"
        ],
        weeklySchedule: [
          { ageGroup: "Muay Thai", day: "Καθημερινά", time: "20:00" }
        ],
        scheduleNote: "Προπόνηση Muay Thai καθημερινά με έμφαση στην τεχνική, φυσική κατάσταση και πνευματική ανάπτυξη.",
        description: "Το πρόγραμμα Muay Thai είναι σχεδιασμένο να παρέχει μια ολοκληρωμένη εμπειρία προπόνησης πολεμικών τεχνών."
      };
    }

    if (program.id === "06") {
      return {
        ages: "16+ ετών",
        duration: "60 λεπτά",
        frequency: "Προσαρμοζόμενη",
        schedule: "Με ραντεβού",
        monthlyPrice: "30€",
        benefits: [
          "Εξατομικευμένο πρόγραμμα",
          "Εκτεταμένα τεστ στάσης και κίνησης",
          "Παρακολούθηση αποτελεσμάτων",
          "Καθοδήγηση"
        ],
        weeklySchedule: [
          { ageGroup: "Προσωπική Προπόνηση", day: "Με ραντεβού", time: "Ευέλικτες ώρες" }
        ],
        scheduleNote: "Εξατομικευμένη προπόνηση με πλήρη προσοχή στις ανάγκες του κάθε ατόμου.",
        description: "Προπόνηση ένας προς έναν για μέγιστα αποτελέσματα και εξατομικευμένη προσέγγιση."
      };
    }

    if (program.id === "07") {
      return {
        ages: "16+ ετών",
        duration: "60 λεπτά",
        frequency: "Προσαρμοζόμενη",
        schedule: "Με ραντεβού",
        monthlyPrice: "120€",
        benefits: [
          "Τεστ δύναμης και αντοχής",
          "Ανατροφοδότηση παρακολούθηση",
          "Ειδική αντοχή και δύναμη",
          "Βελτιωμένη αθλητική απόδοση"
        ],
        weeklySchedule: [
          { ageGroup: "Αθλητική Απόδοση", day: "Με ραντεβού", time: "Ευέλικτες ώρες" }
        ],
        scheduleNote: "Εξειδικευμένο πρόγραμμα για αθλητές που θέλουν να βελτιώσουν την απόδοσή τους.",
        description: "Πρόγραμμα αθλητικής απόδοσης για προχωρημένους αθλητές."
      };
    }

    if (program.id === "08") {
      return {
        ages: "16+ ετών",
        duration: "7 εβδομάδες",
        frequency: "Απομακρυσμένη υποστήριξη",
        schedule: "Στον χώρο σου",
        monthlyPrice: "80€",
        benefits: [
          "Βασισμένο στις προσωπικές σου ανάγκες και δυνατότητες",
          "Το κάνεις στον χώρο σου",
          "Με ή χωρίς όργανα",
          "Μια φορά την εβδομάδα videocall"
        ],
        weeklySchedule: [
          { ageGroup: "Εξατομικευμένος Σχεδιασμός", day: "Videocall", time: "1 φορά/εβδομάδα" }
        ],
        scheduleNote: "Πρόγραμμα που το κάνεις στον χώρο σου με απομακρυσμένη υποστήριξη και εβδομαδιαίο videocall.",
        description: "Εξατομικευμένος σχεδιασμός προγράμματος προσαρμοσμένος στις δικές σου ανάγκες."
      };
    }

    if (program.id === "09") {
      return {
        ages: "16+ ετών",
        duration: "7 εβδομάδες",
        frequency: "Απομακρυσμένη υποστήριξη",
        schedule: "Στον χώρο σου",
        monthlyPrice: "50€",
        benefits: [
          "Γρήγορο",
          "Το παίρνεις σπίτι σου και το κάνεις όπου βρίσκεσαι",
          "Οικονομικό",
          "Έτοιμα πρότυπα προγράμματα"
        ],
        weeklySchedule: [
          { ageGroup: "Έτοιμα Πρότυπα", day: "Οπουδήποτε", time: "Ανά πάσα στιγμή" }
        ],
        scheduleNote: "Έτοιμα πρότυπα προγράμματα που μπορείς να κάνεις όπου βρίσκεσαι με απομακρυσμένη υποστήριξη.",
        description: "Έτοιμα πρότυπα προγράμματα για γρήγορη και οικονομική λύση."
      };
    }

    if (program.id === "10") {
      return {
        ages: "4-12 ετών",
        duration: "45 λεπτά",
        frequency: "1 φορά την εβδομάδα",
        schedule: "Τετάρτη",
        monthlyPrice: "50€",
        benefits: [
          "Οικοδόμηση συνεργασίας και ομαδικότητας",
          "Καθιέρωση καλών προτύπων συμπεριφοράς και πειθαρχίας",
          "Ανάπτυξη συντονισμού και ρυθμού",
          "Βελτιωμένη αθλητική απόδοση"
        ],
        weeklySchedule: [
          { ageGroup: "Κινητική μάθηση", day: "θα ανακηνωθει συντομα", time: "" },
          { ageGroup: "Κινητική ανάπτυξη", day: "θα ανακηνωθει συντομα", time: "" },
          { ageGroup: "Κινητική βελτίωση", day: "θα ανακηνωθει συντομα", time: "" }
        ],
        scheduleNote: "Υπηρεσίες εκπαίδευσης - Χτίζοντας αθλητικές βάσεις για όλα τα σπορ. Οι συνεδρίες προγραμματίζονται μία φορά την εβδομάδα για να αποφευχθεί η κόπωση και να διατηρηθούν τα παιδιά ενεργά και παρακινημένα.",
        description: "Κινητική μάθηση:\nΑνάπτυξη βασικών κινητικών δεξιοτήτων και συντονισμού\n\nΚινητική ανάπτυξη:\nΑνάπτυξη ειδικών αθλητικών δεξιοτήτων\n\nΚινητική βελτίωση:\nΕισαγωγικές τεχνικές δύναμης"
      };
    }

    // Default data for other programs
    return {
      ages: "16+ ετών",
      duration: "60 λεπτά",
      frequency: "2-5 φορές την εβδομάδα",
      schedule: "Καθημερινά με ραντεβού",
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
      description: "Το πρόγραμμα είναι σχεδιασμένο να παρέχει μια ολοκληρωμένη εμπειρία προπόνησης προσαρμοσμένη στις συγκεκριμένες ανάγκες και στόχους σας. Παρακάτω είναι οι βασικές λεπτομέρειες αυτού του προγράμματος."
    };
  };

  const programData = getProgramData();

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow h-[560px] flex flex-col">
      {/* Header Image */}
      <div className="relative h-48 overflow-hidden flex-shrink-0">
        <img 
          src={program.id === "10" ? hyperkidsImages[currentImageIndex] : program.image}
          alt={program.title}
          className="w-full h-full object-cover transition-all duration-500"
          key={program.id === "10" ? currentImageIndex : program.image}
        />
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="absolute top-4 left-4">
          <span className="bg-[#00ffba] text-black px-3 py-1 text-sm font-bold rounded">
            {program.id}
          </span>
        </div>
      </div>

      {/* Program Title */}
      <div className="p-4 pb-2">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-lg font-bold text-gray-900 flex-1" style={{ fontFamily: 'Robert, sans-serif' }}>
            {program.title}
          </h3>
          <span className="text-lg font-bold text-[#00ffba] ml-2 flex-shrink-0">
            {programData.monthlyPrice}
          </span>
        </div>
        <p className="text-gray-600 text-xs leading-relaxed line-clamp-2">
          {program.description}
        </p>
      </div>

      {/* Tabs */}
      <div className="px-4 pb-4 flex-1 overflow-hidden">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-none bg-transparent border-b border-gray-200">
            <TabsTrigger 
              value="details" 
              className="rounded-none text-xs bg-transparent border-b-2 border-transparent data-[state=active]:border-[#00ffba] data-[state=active]:bg-transparent hover:bg-gray-50"
            >
              Λεπτομέρειες
            </TabsTrigger>
            <TabsTrigger 
              value="benefits" 
              className="rounded-none text-xs bg-transparent border-b-2 border-transparent data-[state=active]:border-[#00ffba] data-[state=active]:bg-transparent hover:bg-gray-50"
            >
              Οφέλη
            </TabsTrigger>
            <TabsTrigger 
              value="schedule" 
              className="rounded-none text-xs bg-transparent border-b-2 border-transparent data-[state=active]:border-[#00ffba] data-[state=active]:bg-transparent hover:bg-gray-50"
            >
              Εβδομαδιαίο Πρόγραμμα
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4 h-[140px]">
            <div className="bg-gray-50 p-3 rounded-none h-full">
              {program.id === "10" ? (
                <div className="text-xs space-y-3">
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-1">Κινητική μάθηση:</h5>
                    <p className="text-gray-700">Ανάπτυξη βασικών κινητικών δεξιοτήτων και συντονισμού</p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-1">Κινητική ανάπτυξη:</h5>
                    <p className="text-gray-700">Ανάπτυξη ειδικών αθλητικών δεξιοτήτων</p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-1">Κινητική βελτίωση:</h5>
                    <p className="text-gray-700">Εισαγωγικές τεχνικές δύναμης</p>
                  </div>
                </div>
              ) : (
                <>
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">Στοιχεία Προγράμματος</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <div>
                      <span className="text-gray-600">Ηλικίες:</span>
                      <span className="text-gray-900 font-medium ml-2">{programData.ages}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Διάρκεια:</span>
                      <span className="text-gray-900 font-medium ml-2">{programData.duration}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Συχνότητα:</span>
                      <span className="text-gray-900 font-medium ml-2">{programData.frequency}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Ημέρες:</span>
                      <span className="text-gray-900 font-medium ml-2">{programData.schedule}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="benefits" className="mt-4 h-[140px]">
            <div className="h-full">
              <h4 className="font-semibold text-gray-900 text-sm mb-2">Οφέλη Προγράμματος</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {programData.benefits.map((benefit, index) => (
                  <div key={index} className="bg-gray-50 p-2 rounded-none border-l-2 border-[#00ffba]">
                    <div className="text-gray-900 leading-relaxed">{benefit}</div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="mt-4 h-[140px]">
            <div className="h-full">
              <h4 className="font-semibold text-gray-900 text-sm mb-2">Εβδομαδιαίο Πρόγραμμα</h4>
              <div className="space-y-2 text-xs">
                {programData.weeklySchedule.map((schedule, index) => (
                  <div key={index} className="bg-gray-50 p-2 rounded-none flex justify-between items-center">
                    <div>
                      <span className="text-gray-900 font-medium">{schedule.ageGroup}</span>
                      <span className="text-gray-600 ml-2">{schedule.day}</span>
                    </div>
                    <div className="text-[#00ffba] font-bold">{schedule.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};