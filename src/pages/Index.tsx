import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "@/hooks/useTranslations";
import Navigation from "@/components/landing/Navigation";
import HeroSection from "@/components/landing/HeroSection";
import ProgramsSection from "@/components/landing/ProgramsSection";
import AboutSection from "@/components/landing/AboutSection";
import EliteTrainingSection from "@/components/landing/EliteTrainingSection";
import BlogSection from "@/components/landing/BlogSection";
import ResultsSection from "@/components/landing/ResultsSection";
import ContactSection from "@/components/landing/ContactSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { language, translations, toggleLanguage } = useTranslations();
  const [activeAboutSection, setActiveAboutSection] = useState<number>(1);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  const scrollToPrograms = () => {
    const programsSection = document.getElementById('programs');
    if (programsSection) {
      programsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Override some translations with corrected capitalization
  const correctedTranslations = {
    ...translations,
    heroTitle: language === 'el' ? 'Το ταξίδι του πρωταθλητή' : 'The champion\'s journey',
    heroSubtitle: language === 'el' ? 'Ξεκινάει εδώ' : 'Starts here',
    programs: language === 'el' ? 'προγράμματα' : 'programs',
    explorePrograms: language === 'el' ? 'Εξερεύνηση όλων των προγραμμάτων' : 'Explore all programs',
    supportingYour: language === 'el' ? 'Υποστηρίζοντας το' : 'Supporting your',
    athleticJourney: language === 'el' ? 'Αθλητικό σας ταξίδι' : 'Athletic journey',
    headCoach: language === 'el' ? 'Κύριος προπονητής' : 'Head coach',
    ourVision: language === 'el' ? 'Το όραμά μας' : 'Our vision',
    trainingMethodology: language === 'el' ? 'Μεθοδολογία προπόνησης' : 'Training methodology'
  };

  const navigationItems = [
    { name: correctedTranslations.home, href: "#home" },
    { name: correctedTranslations.programs, href: "#programs" },
    { name: correctedTranslations.about, href: "#about" },
    { name: correctedTranslations.blog, href: "#blog" },
    { name: correctedTranslations.results, href: "#results" },
    { name: correctedTranslations.contact, href: "#contact" }
  ];

  const programs = [
    {
      id: "01",
      title: translations.movementLearning,
      description: translations.movementLearningDesc,
      image: "/lovable-uploads/d049bee3-9df6-4a4b-8aff-88a05957d3ba.png",
      color: "#00ffba"
    },
    {
      id: "02", 
      title: translations.movementDevelopment,
      description: translations.movementDevelopmentDesc,
      image: "/lovable-uploads/99cd2512-1f3a-438a-af79-1385c89c57df.png",
      color: "#00ffba"
    },
    {
      id: "03",
      title: translations.youthStrength, 
      description: translations.youthStrengthDesc,
      image: "/lovable-uploads/ec05107c-d95c-4976-bab8-8d30e55abe8b.png",
      color: "#00ffba"
    },
    {
      id: "04",
      title: translations.fitness,
      description: translations.fitnessDesc,
      image: "/lovable-uploads/b06a27cc-1f96-43d1-a89c-ea4330c70290.png",
      color: "#00ffba"
    },
    {
      id: "05",
      title: translations.muayThai,
      description: translations.muayThaiDesc,
      image: "/lovable-uploads/37c5c9c4-26cd-4d28-8584-2ef582590264.png",
      color: "#00ffba"
    },
    {
      id: "06",
      title: translations.oneByOne,
      description: translations.oneByOneDesc,
      image: "/lovable-uploads/e56e52ce-0033-42c7-a6d2-46563aca2433.png",
      color: "#00ffba"
    },
    {
      id: "07",
      title: translations.athletePerformance,
      description: translations.athletePerformanceDesc,
      image: "/lovable-uploads/24db4858-28e8-402b-acaf-095be2a78e56.png",
      color: "#00ffba"
    },
    {
      id: "08",
      title: "Custom Program Design",
      description: "Εξατομικευμένα προγράμματα προπόνησης σχεδιασμένα ειδικά για τους στόχους και τις ανάγκες σας",
      image: "/lovable-uploads/5db7f8e4-dd3f-4459-99e0-e211ed9b16f5.png",
      color: "#00ffba"
    },
    {
      id: "09",
      title: "Ready Template",
      description: "Έτοιμα πρότυπα προγραμμάτων προπόνησης για άμεση εφαρμογή και γρήγορα αποτελέσματα",
      image: "/lovable-uploads/b00b1740-0d26-4b91-9d41-9c36f78efe94.png",
      color: "#00ffba"
    }
  ];

  return (
    <div className="min-h-screen bg-white font-robert">
      <Navigation
        navigationItems={navigationItems}
        isAuthenticated={isAuthenticated}
        loading={loading}
        language={language}
        onToggleLanguage={toggleLanguage}
        onSignOut={handleSignOut}
        translations={correctedTranslations}
      />

      <HeroSection 
        translations={correctedTranslations}
        onGetStarted={handleGetStarted}
      />

      <ProgramsSection 
        programs={programs}
        translations={correctedTranslations}
      />

      <AboutSection 
        translations={correctedTranslations}
        activeAboutSection={activeAboutSection}
        onSetActiveAboutSection={setActiveAboutSection}
      />

      <EliteTrainingSection 
        translations={correctedTranslations}
      />

      <BlogSection 
        translations={correctedTranslations}
      />

      <ResultsSection 
        translations={correctedTranslations}
      />

      {/* Call to Action Section */}
      <section className="py-16 bg-white text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-black mb-4" style={{ fontFamily: 'Robert Pro, sans-serif' }}>
            Έτοιμος να ξεκινήσεις;
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Ανακάλυψε το πρόγραμμα που ταιριάζει στους στόχους σου και ξεκίνα το ταξίδι προς την κορυφαία απόδοση.
          </p>
          <button 
            onClick={scrollToPrograms}
            className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black px-8 py-3 font-semibold transition-colors"
          >
            ΞΕΚΙΝΑ ΤΩΡΑ
          </button>
        </div>
      </section>

      <ContactSection 
        translations={correctedTranslations}
      />

      <Footer 
        translations={correctedTranslations}
      />
    </div>
  );
};

export default Index;
