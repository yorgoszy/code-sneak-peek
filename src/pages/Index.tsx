
import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "@/hooks/useTranslations";
import Navigation from "@/components/landing/Navigation";
import HeroSection from "@/components/landing/HeroSection";
import ProgramsSection from "@/components/landing/ProgramsSection";
import BlogSection from "@/components/landing/BlogSection";
import AboutSection from "@/components/landing/AboutSection";
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
      image: "/lovable-uploads/32d7b875-008c-4cca-a559-c707588d97de.png",
      color: "#00ffba"
    },
    {
      id: "02", 
      title: translations.movementDevelopment,
      description: translations.movementDevelopmentDesc,
      image: "/lovable-uploads/5c575238-ffcf-4f84-aa73-21fa6377ba7d.png",
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
      image: "/lovable-uploads/a21faccb-2749-42ef-9686-c8e65fadcc5f.png",
      color: "#00ffba"
    },
    {
      id: "05",
      title: translations.muayThai,
      description: translations.muayThaiDesc,
      image: "/lovable-uploads/27d8d572-b93f-4f3c-8f89-cc9e10930c87.png",
      color: "#00ffba"
    },
    {
      id: "06",
      title: translations.oneByOne,
      description: translations.oneByOneDesc,
      image: "/lovable-uploads/bff0a31f-54a3-4c49-9e8a-702d714be8d6.png",
      color: "#00ffba"
    },
    {
      id: "07",
      title: translations.athletePerformance,
      description: translations.athletePerformanceDesc,
      image: "/lovable-uploads/a29fcea9-97f7-45a5-8b9f-a0f30b314aa4.png",
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
