import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "@/hooks/useTranslations";
import Navigation from "@/components/landing/Navigation";
import HeroSection from "@/components/landing/HeroSection";
import ProgramsSection from "@/components/landing/ProgramsSection";
import BlogSection from "@/components/landing/BlogSection";
import AboutSection from "@/components/landing/AboutSection";
import EliteTrainingSection from "@/components/landing/EliteTrainingSection";
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

  const navigationItems = [
    { name: translations.home, href: "#home" },
    { name: translations.programs, href: "#programs" },
    { name: translations.blog, href: "#blog" },
    { name: translations.about, href: "#about" },
    { name: translations.results, href: "#results" },
    { name: translations.contact, href: "#contact" }
  ];

  const programs = [
    {
      id: "01",
      title: translations.movementLearning,
      description: translations.movementLearningDesc,
      image: "/lovable-uploads/980986fa-52f2-4037-8e42-cd74a0db7a79.png",
      color: "#00ffba"
    },
    {
      id: "02", 
      title: translations.movementDevelopment,
      description: translations.movementDevelopmentDesc,
      image: "/lovable-uploads/0833c496-f8f2-48ac-9a5c-bdbc319e0708.png",
      color: "#00ffba"
    },
    {
      id: "03",
      title: translations.youthStrength, 
      description: translations.youthStrengthDesc,
      image: "/lovable-uploads/f8f84c19-d969-4da5-a85d-fe764201fc6b.png",
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
      image: "/lovable-uploads/a29fcea9-97f7-45a5-8b9f-a0f30b314aa4.png",
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
        translations={translations}
      />

      <HeroSection 
        translations={translations}
        onGetStarted={handleGetStarted}
      />

      <ProgramsSection 
        programs={programs}
        translations={translations}
      />

      <BlogSection 
        translations={translations}
      />

      <AboutSection 
        translations={translations}
        activeAboutSection={activeAboutSection}
        onSetActiveAboutSection={setActiveAboutSection}
      />

      <EliteTrainingSection 
        translations={translations}
      />

      <ResultsSection 
        translations={translations}
      />

      <ContactSection 
        translations={translations}
      />

      <Footer 
        translations={translations}
      />
    </div>
  );
};

export default Index;
