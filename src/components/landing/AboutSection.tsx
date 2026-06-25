import React, { useState } from 'react';
import theCoachBg from '@/assets/the-coach-bg.png.asset.json';
import theVisionBg from '@/assets/the-vision-bg.png.asset.json';
import theMethodBg from '@/assets/the-method-bg.png.asset.json';
import coachContentBg from '@/assets/coach-content-bg.png.asset.json';
import methodContentBg from '@/assets/method-content-bg.png.asset.json';
import visionContentBg from '@/assets/vis2.png.asset.json';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AboutSectionProps {
  translations: any;
}

const AboutSection: React.FC<AboutSectionProps> = ({ translations }) => {
  const [api, setApi] = useState<any>();

  const slides = [
    {
      id: 1,
      label: "the coach",
      title: translations.headCoach,
      description: translations.language === 'en'
        ? "Georgios Zygouris — graduate of Physical Education & Sport Science (Aristotle University, 2023), professional Muay Thai athlete and certified coach since 2024. A training environment where children, teenagers and adults discover their strengths, build character through sport, and find their unique place in the athletic world."
        : "Γεώργιος Ζυγούρης — απόφοιτος ΤΕΦΑΑ ΑΠΘ (2023), επαγγελματίας αθλητής Muay Thai και πιστοποιημένος προπονητής από το 2024. Ένα προπονητικό περιβάλλον όπου παιδιά, έφηβοι και ενήλικες ανακαλύπτουν τις δυνάμεις τους, χτίζουν χαρακτήρα μέσω του αθλητισμού και βρίσκουν τη μοναδική τους θέση στον αθλητικό κόσμο.",
      image: theCoachBg.url,
      contentImage: coachContentBg.url,
    },
    {
      id: 2,
      label: "the vision",
      title: translations.ourVision,
      description: translations.language === 'en'
        ? "Combining scientific knowledge with real-world experience, we apply skill development and performance-focused training tailored to each age and stage. Movement is more than physical — it is self-expression, confidence and the power to grow through challenge."
        : "Συνδυάζοντας επιστημονική γνώση με πραγματική εμπειρία, εφαρμόζουμε ανάπτυξη δεξιοτήτων και προπόνηση εστιασμένη στην απόδοση, προσαρμοσμένη σε κάθε ηλικία. Η κίνηση είναι κάτι περισσότερο από φυσικό — είναι αυτοέκφραση, αυτοπεποίθηση και η δύναμη να μεγαλώνουμε μέσα από την πρόκληση.",
      image: theVisionBg.url,
      contentImage: visionContentBg.url,
    },
    {
      id: 3,
      label: "the method",
      title: translations.trainingMethodology,
      description: translations.language === 'en'
        ? "Progressive skill development and reinforcement of proper movement patterns tailored to each individual. Through comprehensive assessment we establish clear objectives, create a structured timeline and design a personalised training plan built exclusively for you."
        : "Προοδευτική ανάπτυξη δεξιοτήτων και ενίσχυση σωστών κινητικών προτύπων προσαρμοσμένη στο κάθε άτομο. Μέσω ολοκληρωμένης αξιολόγησης καθορίζουμε σαφείς στόχους, δημιουργούμε δομημένο χρονοδιάγραμμα και σχεδιάζουμε εξατομικευμένο πρόγραμμα προπόνησης.",
      image: theMethodBg.url,
      contentImage: methodContentBg.url,
    },
  ];

  return (
    <section id="about" className="pb-20 bg-white relative overflow-hidden">
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {slides.map((slide) => (
            <CarouselItem key={slide.id} className="basis-full">
              {/* Banner */}
              <div className="relative w-full overflow-hidden flex items-center justify-center" style={{ height: 'calc(10vw - 1px)' }}>
                <div
                  className="absolute inset-0 bg-cover"
                  style={{ backgroundImage: `url(${slide.image})`, opacity: 0.6, backgroundPosition: 'center center' }}
                />
                <div className="absolute inset-0 bg-black/30" />

                <button
                  onClick={() => api?.scrollPrev()}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white p-2 hover:border hover:border-white transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>

                <h3
                  className="relative z-10 text-white text-center px-4"
                  style={{ fontFamily: '"Roobert Pro", sans-serif', fontWeight: 500, fontSize: '15.6vw', lineHeight: 1 }}
                >
                  {slide.label}
                </h3>

                <button
                  onClick={() => api?.scrollNext()}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white p-2 hover:border hover:border-white transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>

              {/* Split Content: image left, text right */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  {/* Left — image */}
                  <div className="relative">
                    <img
                      src={slide.contentImage || slide.image}
                      alt={slide.title}
                      className="w-full h-auto object-contain"
                    />
                  </div>

                  {/* Right — text */}
                  <div className="flex flex-col justify-center">
                    <h3 className="text-2xl font-bold mb-4 text-black">{slide.title}</h3>
                    <p className="text-sm leading-relaxed text-black">{slide.description}</p>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
};

export default AboutSection;
