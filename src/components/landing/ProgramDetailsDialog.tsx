
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, Users, Calendar, Target } from "lucide-react";

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
    ages: "4-8 years",
    duration: "45 minutes",
    frequency: "1 time per week",
    schedule: "Wednesday",
    benefits: [
      "Develop fundamental movement skills",
      "Improve coordination and balance",
      "Build confidence through play",
      "Learn teamwork and social skills"
    ],
    weeklySchedule: [
      "Warm-up activities (10 min)",
      "Skill development games (20 min)",
      "Fun physical challenges (10 min)",
      "Cool down and stretching (5 min)"
    ],
    pricing: [
      {
        title: "Monthly Plan",
        price: "€60/month",
        features: ["4 sessions per month", "Professional coaching", "Progress tracking"]
      },
      {
        title: "Term Plan",
        price: "€150/term",
        features: ["12 sessions", "15% discount", "Equipment included"]
      }
    ]
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-black text-white border-gray-800 rounded-none">
        <DialogHeader className="border-b border-gray-800 pb-6">
          <DialogTitle className="text-4xl font-bold text-center">
            Movement Learning
          </DialogTitle>
          <p className="text-center text-gray-300 text-lg">
            Foundation for Athletic Excellence
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6">
          {/* Left Side - Navigation and Program Info */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="text-[#00ffba] text-sm font-semibold tracking-wider">
                PROGRAM INFORMATION
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Begin Your
                </h2>
                <h2 className="text-3xl font-bold text-[#00ffba]">
                  Training Journey
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-[#00ffba] font-semibold">
                <span className="text-2xl">01</span>
                <span className="border-b-2 border-[#00ffba] pb-1">Program Details</span>
              </div>
              <div className="text-gray-400 space-y-2">
                <div>02 Program Benefits</div>
                <div>03 Weekly Schedule</div>
                <div>04 Pricing Plans</div>
              </div>
            </div>
          </div>

          {/* Right Side - Program Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">Program Details</h3>
              <p className="text-gray-300 mb-6">
                Our Movement Learning program is designed to provide a comprehensive training experience
                tailored to your specific needs and goals. Below are the key details of this program.
              </p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-none">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-[#00ffba]" />
                  <span className="text-gray-400 text-sm">Ages:</span>
                </div>
                <div className="text-white font-semibold">{programDetails.ages}</div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-none">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-[#00ffba]" />
                  <span className="text-gray-400 text-sm">Duration:</span>
                </div>
                <div className="text-white font-semibold">{programDetails.duration}</div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-none">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-[#00ffba]" />
                  <span className="text-gray-400 text-sm">Frequency:</span>
                </div>
                <div className="text-white font-semibold">{programDetails.frequency}</div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-none">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-[#00ffba]" />
                  <span className="text-gray-400 text-sm">Schedule:</span>
                </div>
                <div className="text-white font-semibold">{programDetails.schedule}</div>
              </div>
            </div>

            {/* Program Benefits */}
            <div className="mt-8">
              <h4 className="text-xl font-bold text-white mb-4">Program Benefits</h4>
              <div className="space-y-2">
                {programDetails.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#00ffba] rounded-full flex-shrink-0"></div>
                    <span className="text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Schedule */}
            <div className="mt-8">
              <h4 className="text-xl font-bold text-white mb-4">Weekly Schedule</h4>
              <div className="space-y-2">
                {programDetails.weeklySchedule.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 border border-[#00ffba] rounded-none flex items-center justify-center text-xs text-[#00ffba]">
                      {index + 1}
                    </div>
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Button */}
            <div className="mt-8">
              <button className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black font-semibold py-3 px-6 rounded-none transition-colors">
                Επικοινωνία για Εγγραφή
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
