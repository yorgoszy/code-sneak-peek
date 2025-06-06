
import React from 'react';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ProgramBenefitsSection } from './ProgramBenefitsSection';
import { ProgramScheduleSection } from './ProgramScheduleSection';
import { ProgramPricingCard } from './ProgramPricingCard';

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
}

export const ProgramDetailsContent: React.FC<ProgramDetailsContentProps> = ({ program, onClose }) => {
  // Movement Learning specific details
  const getMovementLearningDetails = () => ({
    ages: "4-8 χρόνια / 4-8 years",
    duration: "45 λεπτά / 45 minutes",
    frequency: "1 φορά την εβδομάδα / 1 time per week",
    schedule: "Τετάρτη / Wednesday",
    benefits: [
      "Ανάπτυξη βασικών κινητικών δεξιοτήτων και συντονισμού / Development of fundamental movement skills and coordination",
      "Εκμάθηση ρυθμού και χρονισμού στα κινητικά μοτίβα / Learning rhythm and timing in movement patterns", 
      "Οικοδόμηση συνεργασίας και ομαδικών ικανοτήτων / Building cooperation and teamwork abilities",
      "Καθιέρωση καλών συμπεριφορικών προτύπων και πειθαρχίας / Establishing good behavior patterns and discipline"
    ],
    weeklySchedule: [
      {
        ageGroup: "Ηλικίες 4-6 / Ages 4-6",
        day: "Τετάρτη / Wednesday",
        time: "17:15 - 18:00"
      },
      {
        ageGroup: "Ηλικίες 6-8 / Ages 6-8", 
        day: "Τετάρτη / Wednesday",
        time: "18:15 - 19:00"
      }
    ],
    scheduleNote: "Οι συνεδρίες προγραμματίζονται μία φορά την εβδομάδα για να αποφευχθεί η κούραση και να διατηρηθούν τα παιδιά ενθουσιασμένα και παρακινημένα. Επικοινωνήστε μαζί μας για εγγραφή και οποιεσδήποτε ερωτήσεις προγραμματισμού. / Sessions are scheduled once per week to avoid fatigue and keep children engaged and motivated. Contact us for enrollment and any scheduling questions.",
    pricing: [
      {
        title: "Μηνιαίο / Monthly",
        price: "€50",
        period: "/μήνα / /month",
        sessions: "4 συνεδρίες ανά μήνα (1 ανά εβδομάδα) / 4 sessions per month (1 per week)",
        features: [
          "Εξατομικευμένη καθοδήγηση / Personalized coaching",
          "Παρακολούθηση προόδου / Progress tracking", 
          "Ευέλικτος προγραμματισμός / Flexible scheduling"
        ]
      },
      {
        title: "Τριμηνιαίο / Quarterly",
        price: "€120",
        period: "/τρίμηνο / /quarter",
        sessions: "12 συνεδρίες (3 μήνες) / 12 sessions (3 months)",
        savings: "Εξοικονόμηση €30 / Save €30",
        popular: true,
        features: [
          "Εξατομικευμένη καθοδήγηση / Personalized coaching",
          "Παρακολούθηση προόδου / Progress tracking",
          "Ευέλικτος προγραμματισμός / Flexible scheduling",
          "Προτεραιότητα κράτησης / Priority booking"
        ]
      },
      {
        title: "Ετήσιο / Annual", 
        price: "€360",
        period: "/έτος / /year",
        sessions: "48 συνεδρίες (12 μήνες) / 48 sessions (12 months)",
        savings: "Εξοικονόμηση €240 / Save €240",
        features: [
          "Εξατομικευμένη καθοδήγηση / Personalized coaching",
          "Παρακολούθηση προόδου / Progress tracking",
          "Ευέλικτος προγραμματισμός / Flexible scheduling", 
          "Προτεραιότητα κράτησης / Priority booking",
          "Δωρεάν αξιολόγηση / Free assessment"
        ]
      }
    ]
  });

  const programDetails = program.id === "01" ? getMovementLearningDetails() : {
    ages: "4-8 χρόνια",
    duration: "45 λεπτά", 
    frequency: "1 φορά την εβδομάδα",
    schedule: "Τετάρτη",
    benefits: [
      "Ανάπτυξη βασικών κινητικών δεξιοτήτων",
      "Βελτίωση συντονισμού και ισορροπίας",
      "Οικοδόμηση αυτοπεποίθησης μέσω παιχνιδιού",
      "Εκμάθηση ομαδικότητας και κοινωνικών δεξιοτήτων"
    ],
    weeklySchedule: [],
    scheduleNote: "",
    pricing: [
      {
        title: "Μηνιαίο Πακέτο",
        price: "€60/μήνα",
        features: ["4 συνεδρίες ανά μήνα", "Επαγγελματική καθοδήγηση", "Παρακολούθηση προόδου"]
      }
    ]
  };

  return (
    <div className="flex-1 p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-4">Program Details</h2>
          <p className="text-gray-300 max-w-2xl">
            Our Movement Learning program is designed to provide a comprehensive training experience tailored to your specific needs and goals. Below are the key details of this program.
          </p>
        </div>
        <Button
          onClick={onClose}
          variant="outline"
          size="sm"
          className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 rounded-none"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Program Details Grid */}
      <div className="grid grid-cols-2 gap-6 mb-12">
        <div className="bg-gray-800 p-6 rounded-none border border-gray-700">
          <div className="text-gray-400 text-sm mb-2">Ages:</div>
          <div className="text-white text-lg font-medium">{programDetails.ages}</div>
        </div>
        <div className="bg-gray-800 p-6 rounded-none border border-gray-700">
          <div className="text-gray-400 text-sm mb-2">Duration:</div>
          <div className="text-white text-lg font-medium">{programDetails.duration}</div>
        </div>
        <div className="bg-gray-800 p-6 rounded-none border border-gray-700">
          <div className="text-gray-400 text-sm mb-2">Frequency:</div>
          <div className="text-white text-lg font-medium">{programDetails.frequency}</div>
        </div>
        <div className="bg-gray-800 p-6 rounded-none border border-gray-700">
          <div className="text-gray-400 text-sm mb-2">Schedule:</div>
          <div className="text-white text-lg font-medium">{programDetails.schedule}</div>
        </div>
      </div>

      <ProgramBenefitsSection benefits={programDetails.benefits} />

      <ProgramScheduleSection 
        weeklySchedule={programDetails.weeklySchedule}
        scheduleNote={programDetails.scheduleNote}
        shouldShow={program.id === "01"}
      />

      {/* Pricing Plans */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-6">Pricing Plans</h3>
        <p className="text-gray-300 mb-6">
          Choose the plan that best fits your training goals and schedule. All plans include personalized coaching and access to our facilities.
        </p>
        
        <div className="grid grid-cols-3 gap-6">
          {programDetails.pricing.map((plan, index) => (
            <ProgramPricingCard key={index} plan={plan} />
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-12 text-center">
        <Button 
          className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black font-bold py-4 px-8 text-lg rounded-none"
          style={{ fontFamily: 'Robert, sans-serif' }}
        >
          Επικοινωνία για Εγγραφή / Contact for Enrollment
        </Button>
        <p className="text-gray-400 mt-4">
          Επικοινωνήστε μαζί μας για περισσότερες πληροφορίες και εγγραφή στο πρόγραμμα
        </p>
        <p className="text-gray-400">
          Contact us for more information and program enrollment
        </p>
      </div>
    </div>
  );
};
