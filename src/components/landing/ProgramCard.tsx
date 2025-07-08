import React, { useState } from 'react';
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
        description: "Το πρόγραμμα Εκμάθηση Κίνησης είναι σχεδιασμένο να παρέχει μια ολοκληρωμένη εμπειρία προπόνησης προσαρμοσμένη στις συγκεκριμένες ανάγκες και στόχους σας. Παρακάτω είναι οι βασικές λεπτομέρειες αυτού του προγράμματος."
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
        description: "Το πρόγραμμα Ανάπτυξη Κίνησης είναι σχεδιασμένο να παρέχει μια ολοκληρωμένη εμπειρία προπόνησης προσαρμοσμένη στις συγκεκριμένες ανάγκες και στόχους σας. Παρακάτω είναι οι βασικές λεπτομέρειες αυτού του προγράμματος."
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
        description: "Το πρόγραμμα Δύναμη Νέων είναι σχεδιασμένο να παρέχει μια ολοκληρωμένη εμπειρία προπόνησης προσαρμοσμένη στις συγκεκριμένες ανάγκες και στόχους σας. Παρακάτω είναι οι βασικές λεπτομέρειες αυτού του προγράμματος."
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
    <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow h-auto flex flex-col">
      {/* Header Image */}
      <div className="relative h-48 overflow-hidden flex-shrink-0">
        <img 
          src={program.image} 
          alt={program.title}
          className="w-full h-full object-cover transition-all duration-300 filter grayscale"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="absolute top-4 left-4">
          <span className="bg-[#00ffba] text-black px-3 py-1 text-sm font-bold rounded">
            {program.id}
          </span>
        </div>
      </div>

      {/* Program Title */}
      <div className="p-6 pb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Robert, sans-serif' }}>
          {program.title}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          {program.description}
        </p>
      </div>

      {/* Tabs */}
      <div className="px-6 pb-6 flex-1">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-none bg-gray-100">
            <TabsTrigger value="details" className="rounded-none text-xs">
              Λεπτομέρειες
            </TabsTrigger>
            <TabsTrigger value="benefits" className="rounded-none text-xs">
              Οφέλη
            </TabsTrigger>
            <TabsTrigger value="schedule" className="rounded-none text-xs">
              Εβδομαδιαίο Πρόγραμμα
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <div className="space-y-3">
              <div className="bg-gray-50 p-4 rounded-none">
                <h4 className="font-semibold text-gray-900 mb-3">Στοιχεία Προγράμματος</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ηλικίες:</span>
                    <span className="text-gray-900 font-medium">{programData.ages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Διάρκεια:</span>
                    <span className="text-gray-900 font-medium">{programData.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Συχνότητα:</span>
                    <span className="text-gray-900 font-medium">{programData.frequency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ημέρες:</span>
                    <span className="text-gray-900 font-medium">{programData.schedule}</span>
                  </div>
                </div>
              </div>
              <div className="text-gray-600 text-sm leading-relaxed">
                {programData.description}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="benefits" className="mt-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Οφέλη Προγράμματος</h4>
              <div className="grid grid-cols-1 gap-3">
                {programData.benefits.map((benefit, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-none border-l-4 border-[#00ffba]">
                    <div className="text-gray-900 text-sm leading-relaxed">{benefit}</div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="mt-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Εβδομαδιαίο Πρόγραμμα</h4>
              <div className="space-y-3">
                {programData.weeklySchedule.map((schedule, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-none">
                    <div className="text-gray-900 font-medium text-sm mb-1">{schedule.ageGroup}</div>
                    <div className="text-gray-600 text-sm mb-1">{schedule.day}</div>
                    <div className="text-[#00ffba] font-bold text-sm">{schedule.time}</div>
                  </div>
                ))}
              </div>
              <div className="text-gray-600 text-xs mt-3 p-3 bg-gray-50 rounded-none border border-gray-200">
                <strong>Σημείωση:</strong> {programData.scheduleNote}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};