
import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProgramBenefitsSection } from './program-details/ProgramBenefitsSection';
import { ProgramScheduleSection } from './program-details/ProgramScheduleSection';
import { ProgramPricingCard } from './program-details/ProgramPricingCard';

interface Program {
  id: string;
  title: string;
  description: string;
  image: string;
  color: string;
}

interface ProgramsSectionProps {
  programs: Program[];
  translations: any;
}

const ProgramsSection: React.FC<ProgramsSectionProps> = ({ programs, translations }) => {
  const [api, setApi] = useState<any>();
  const [activeTab, setActiveTab] = useState("details");
  const isMobile = useIsMobile();

  // Auto-rotate carousel on mobile
  useEffect(() => {
    if (!api || !isMobile) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 1500);

    return () => clearInterval(interval);
  }, [api, isMobile]);

  // Δεδομένα για τα tabs
  const getTabData = () => {
    return {
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
        }
      ]
    };
  };

  const tabData = getTabData();

  return (
    <>
      <section id="programs" className="py-20 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Robert, sans-serif' }}>
              {translations.ourPrograms}
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {translations.programsDescription}
            </p>
          </div>

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-12">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 bg-gray-800 rounded-none">
              <TabsTrigger 
                value="details" 
                className="rounded-none text-white data-[state=active]:bg-[#00ffba] data-[state=active]:text-black"
              >
                01. Λεπτομέρειες Προγράμματος
              </TabsTrigger>
              <TabsTrigger 
                value="benefits" 
                className="rounded-none text-white data-[state=active]:bg-[#00ffba] data-[state=active]:text-black"
              >
                02. Οφέλη Προγράμματος
              </TabsTrigger>
              <TabsTrigger 
                value="schedule" 
                className="rounded-none text-white data-[state=active]:bg-[#00ffba] data-[state=active]:text-black"
              >
                03. Εβδομαδιαίο Πρόγραμμα
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-8">
              <div className="relative">
            {/* Header with navigation */}
            <div className="flex justify-between items-center mb-8">
              <div className="text-left">
                {translations.language === 'en' ? (
                  <>
                    <h3 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Robert, sans-serif' }}>
                      Explore all
                    </h3>
                    <h4 className="text-3xl font-bold text-white" style={{ fontFamily: 'Robert, sans-serif' }}>
                      programs
                    </h4>
                  </>
                ) : (
                  <>
                    <h3 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Robert, sans-serif' }}>
                      Εξερεύνηση όλων
                    </h3>
                    <h4 className="text-3xl font-bold text-white" style={{ fontFamily: 'Robert, sans-serif' }}>
                      των προγραμμάτων
                    </h4>
                  </>
                )}
              </div>
            </div>

            <Carousel
              setApi={setApi}
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              {/* Navigation buttons positioned absolutely in top right */}
              <div className="absolute -top-16 right-0 flex gap-2 z-10">
                <CarouselPrevious className="relative inset-auto translate-x-0 translate-y-0 h-10 w-10 bg-transparent border-none text-white hover:text-[#00ffba] hover:bg-transparent rounded-none">
                  <ChevronLeft className="h-6 w-6" />
                </CarouselPrevious>
                <CarouselNext className="relative inset-auto translate-x-0 translate-y-0 h-10 w-10 bg-transparent border-none text-white hover:text-[#00ffba] hover:bg-transparent rounded-none">
                  <ChevronRight className="h-6 w-6" />
                </CarouselNext>
              </div>

              <CarouselContent className="-ml-4">
                {programs.map((program) => (
                  <CarouselItem 
                    key={program.id} 
                    className={`pl-4 ${isMobile ? 'basis-full' : 'basis-1/3'}`}
                  >
                    <div 
                      className="bg-white rounded-lg overflow-hidden shadow-lg h-[450px] flex flex-col"
                    >
                      <div className="relative h-48 overflow-hidden flex-shrink-0">
                        <img 
                          src={program.image} 
                          alt={program.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300 filter grayscale group-hover:grayscale-0"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all duration-300"></div>
                        <div className="absolute top-4 left-4">
                          <span className="bg-[#00ffba] text-black px-3 py-1 text-sm font-bold rounded">
                            {program.id}
                          </span>
                        </div>
                      </div>
                      <div className="p-6 flex-1 flex flex-col relative">
                        <h3 className="text-xl font-bold text-gray-900 mb-3 min-h-[3rem] flex items-start" style={{ fontFamily: 'Robert, sans-serif' }}>
                          {program.title}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed flex-1 overflow-hidden">
                          {program.description}
                        </p>
                        <div className="mt-4">
                          <span className="text-[#00ffba] font-semibold text-sm">
                            Διαθέσιμο Πρόγραμμα
                          </span>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
              </div>
            </TabsContent>

            <TabsContent value="benefits" className="mt-8">
              <div className="max-w-4xl mx-auto">
                <ProgramBenefitsSection benefits={tabData.benefits} />
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="mt-8">
              <div className="max-w-4xl mx-auto">
                <ProgramScheduleSection 
                  weeklySchedule={tabData.weeklySchedule}
                  scheduleNote="Οι συνεδρίες προγραμματίζονται για να εξασφαλιστεί η καλύτερη δυνατή πρόοδος. Επικοινωνήστε μαζί μας για εγγραφή."
                  shouldShow={true}
                />
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tabData.pricing.map((plan, index) => (
                    <ProgramPricingCard key={index} plan={plan} />
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </>
  );
};

export default ProgramsSection;
