
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, Users, Calendar, Target, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Program {
  id: string;
  title: string;
  description: string;
  image: string;
  color: string;
  details?: {
    ages: string;
    duration: string;
    frequency: string;
    schedule: string;
    benefits: string[];
    weeklySchedule: string[];
    pricing: {
      title: string;
      price: string;
      features: string[];
    }[];
  };
}

interface ProgramDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  program: Program | null;
}

export const ProgramDetailsDialog: React.FC<ProgramDetailsDialogProps> = ({
  isOpen,
  onClose,
  program
}) => {
  if (!program) return null;

  // Ειδικά στοιχεία για το Movement Learning πρόγραμμα
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto bg-black text-white border-gray-700 rounded-none p-0">
        {/* Sidebar Navigation */}
        <div className="flex">
          <div className="w-80 bg-black p-8 border-r border-gray-700">
            <div className="mb-8">
              <div className="text-[#00ffba] text-sm font-medium mb-4">PROGRAM INFORMATION</div>
              <h1 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Robert, sans-serif' }}>
                Begin Your
              </h1>
              <h1 className="text-4xl font-bold mb-8" style={{ color: '#00ffba', fontFamily: 'Robert, sans-serif' }}>
                Training Journey
              </h1>
            </div>

            <nav className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-[#00ffba] text-xl font-bold">01</span>
                <span className="text-white font-medium border-b border-[#00ffba] pb-1">Program Details</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-500 text-xl font-bold">02</span>
                <span className="text-gray-500 font-medium">Program Benefits</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-500 text-xl font-bold">03</span>
                <span className="text-gray-500 font-medium">Weekly Schedule</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-500 text-xl font-bold">04</span>
                <span className="text-gray-500 font-medium">Pricing Plans</span>
              </div>
            </nav>
          </div>

          {/* Main Content */}
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

            {/* Program Benefits */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-white mb-6">Program Benefits</h3>
              <p className="text-gray-300 mb-6">
                Participating in our Movement Learning program offers numerous benefits that extend beyond physical fitness. Here are the key advantages you'll experience:
              </p>
              <div className="grid grid-cols-2 gap-6">
                {programDetails.benefits.map((benefit, index) => (
                  <div key={index} className="bg-gray-800 p-6 rounded-none border border-gray-700">
                    <div className="text-white leading-relaxed">{benefit}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Schedule */}
            {program.id === "01" && (
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6">Weekly Schedule</h3>
                <p className="text-gray-300 mb-6">
                  Our Movement Learning program offers flexible scheduling to accommodate your busy lifestyle.
                </p>
                
                <div className="bg-gray-800 p-6 rounded-none border border-[#00ffba] mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-[#00ffba]" />
                    <span className="text-[#00ffba] font-medium">Weekly Schedule</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    {programDetails.weeklySchedule.map((schedule, index) => (
                      <div key={index} className="bg-gray-700 p-4 rounded-none">
                        <div className="text-white font-medium mb-2">{schedule.ageGroup}</div>
                        <div className="text-gray-300 text-sm mb-1">{schedule.day}</div>
                        <div className="text-[#00ffba] font-bold">{schedule.time}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-gray-300 text-sm">
                    <strong>Note:</strong> {programDetails.scheduleNote}
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Plans */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Pricing Plans</h3>
              <p className="text-gray-300 mb-6">
                Choose the plan that best fits your training goals and schedule. All plans include personalized coaching and access to our facilities.
              </p>
              
              <div className="grid grid-cols-3 gap-6">
                {programDetails.pricing.map((plan, index) => (
                  <div key={index} className={`bg-gray-800 p-6 rounded-none border ${plan.popular ? 'border-[#00ffba]' : 'border-gray-700'} relative`}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-[#00ffba] text-black px-4 py-1 text-sm font-bold rounded-none">
                          POPULAR
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center mb-6">
                      <h4 className="text-xl font-bold text-white mb-2">{plan.title}</h4>
                      <div className="text-3xl font-bold text-[#00ffba] mb-1">{plan.price}</div>
                      <div className="text-gray-400 text-sm">{plan.period}</div>
                      {plan.sessions && (
                        <div className="text-gray-300 text-sm mt-2">{plan.sessions}</div>
                      )}
                      {plan.savings && (
                        <div className="text-[#00ffba] text-sm font-medium mt-2">{plan.savings}</div>
                      )}
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-3">
                          <Check className="w-4 h-4 text-[#00ffba] flex-shrink-0" />
                          <span className="text-gray-300 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      className={`w-full rounded-none font-bold ${
                        plan.popular 
                          ? 'bg-[#00ffba] hover:bg-[#00ffba]/90 text-black' 
                          : 'bg-transparent border border-gray-600 text-white hover:bg-gray-700'
                      }`}
                    >
                      Choose Plan
                    </Button>
                  </div>
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
