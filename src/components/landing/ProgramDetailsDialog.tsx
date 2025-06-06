
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

  const programDetails = program.details || {
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
    weeklySchedule: [
      "Δραστηριότητες ζεστάματος (10 λεπτά)",
      "Παιχνίδια ανάπτυξης δεξιοτήτων (20 λεπτά)",
      "Διασκεδαστικές φυσικές προκλήσεις (10 λεπτά)",
      "Ηρεμία και διάταση (5 λεπτά)"
    ],
    pricing: [
      {
        title: "Μηνιαίο Πακέτο",
        price: "€60/μήνα",
        features: ["4 συνεδρίες ανά μήνα", "Επαγγελματική καθοδήγηση", "Παρακολούθηση προόδου"]
      },
      {
        title: "Τριμηνιαίο Πακέτο",
        price: "€150/τρίμηνο",
        features: ["12 συνεδρίες", "15% έκπτωση", "Εξοπλισμός περιλαμβάνεται"]
      }
    ]
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white border-gray-200 rounded-none p-0">
        {/* Header με εικόνα και τίτλο */}
        <div className="relative h-64 overflow-hidden">
          <img
            src={program.image}
            alt={program.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute top-4 right-4">
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="bg-white/90 hover:bg-white border-none rounded-none"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="absolute bottom-6 left-6">
            <div className="flex items-center gap-3 mb-2">
              <span 
                className="text-3xl font-bold bg-black/70 px-3 py-1 rounded-none text-white"
                style={{ color: '#00ffba' }}
              >
                {program.id}
              </span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Robert, sans-serif' }}>
              {program.title}
            </h1>
            <p className="text-white/90 text-lg max-w-2xl">
              {program.description}
            </p>
          </div>
        </div>

        <div className="p-8">
          {/* Στοιχεία Προγράμματος */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-50 p-6 rounded-none border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-5 h-5 text-[#00ffba]" />
                <span className="text-sm font-medium text-gray-600">Ηλικίες</span>
              </div>
              <div className="text-xl font-bold text-gray-900">{programDetails.ages}</div>
            </div>

            <div className="bg-gray-50 p-6 rounded-none border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-5 h-5 text-[#00ffba]" />
                <span className="text-sm font-medium text-gray-600">Διάρκεια</span>
              </div>
              <div className="text-xl font-bold text-gray-900">{programDetails.duration}</div>
            </div>

            <div className="bg-gray-50 p-6 rounded-none border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <Target className="w-5 h-5 text-[#00ffba]" />
                <span className="text-sm font-medium text-gray-600">Συχνότητα</span>
              </div>
              <div className="text-xl font-bold text-gray-900">{programDetails.frequency}</div>
            </div>

            <div className="bg-gray-50 p-6 rounded-none border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="w-5 h-5 text-[#00ffba]" />
                <span className="text-sm font-medium text-gray-600">Πρόγραμμα</span>
              </div>
              <div className="text-xl font-bold text-gray-900">{programDetails.schedule}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Οφέλη Προγράμματος */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Robert, sans-serif' }}>
                Οφέλη Προγράμματος
              </h3>
              <div className="space-y-4">
                {programDetails.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#00ffba] rounded-none flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-black" />
                    </div>
                    <span className="text-gray-700 leading-relaxed">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Εβδομαδιαίο Πρόγραμμα */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Robert, sans-serif' }}>
                Εβδομαδιαίο Πρόγραμμα
              </h3>
              <div className="space-y-4">
                {programDetails.weeklySchedule.map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-8 h-8 border-2 border-[#00ffba] rounded-none flex items-center justify-center text-sm font-bold text-[#00ffba] flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="text-gray-700 leading-relaxed pt-1">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center" style={{ fontFamily: 'Robert, sans-serif' }}>
              Πακέτα & Τιμές
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {programDetails.pricing.map((plan, index) => (
                <div key={index} className="border border-gray-200 rounded-none p-6 hover:border-[#00ffba] transition-colors">
                  <div className="text-center mb-6">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">{plan.title}</h4>
                    <div className="text-3xl font-bold text-[#00ffba]">{plan.price}</div>
                  </div>
                  <div className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-[#00ffba] flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
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
              Επικοινωνία για Εγγραφή
            </Button>
            <p className="text-gray-600 mt-4">
              Επικοινωνήστε μαζί μας για περισσότερες πληροφορίες και εγγραφή στο πρόγραμμα
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
