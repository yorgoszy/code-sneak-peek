import React, { useState, useEffect } from 'react';
import hypergymImage from '@/assets/hypergym-service.png';
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "@/hooks/useTranslations";
import { useIsPWA } from "@/hooks/useIsPWA";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/landing/Navigation";
import HeroSection from "@/components/landing/HeroSection";
import ProgramsSection from "@/components/landing/ProgramsSection";
import AboutSection from "@/components/landing/AboutSection";
import CertificatesSection from "@/components/landing/CertificatesSection";
import EliteTrainingSection from "@/components/landing/EliteTrainingSection";
import LiveProgramSection from "@/components/landing/LiveProgramSection";
import BlogSection from "@/components/landing/BlogSection";
import ResultsSection from "@/components/landing/ResultsSection";

import Footer from "@/components/landing/Footer";

const Index = () => {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { language, translations, toggleLanguage } = useTranslations();
  const [activeAboutSection, setActiveAboutSection] = useState<number>(1);
  const isPWA = useIsPWA();
  const [userRole, setUserRole] = useState<string | null>(null);

  // PWA Auto-redirect to dashboard when logged in
  useEffect(() => {
    if (!isPWA || !isAuthenticated || loading) return;

    const fetchUserRole = async () => {
      try {
        const { data: userProfile } = await supabase
          .from('app_users')
          .select('role')
          .eq('auth_user_id', user?.id)
          .single();

        if (userProfile?.role) {
          setUserRole(userProfile.role);
          // Redirect to appropriate dashboard based on role
          if (userProfile.role === 'admin') {
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        }
      } catch (error) {
        console.error('Error fetching user role for PWA redirect:', error);
      }
    };

    fetchUserRole();
  }, [isPWA, isAuthenticated, loading, user?.id, navigate]);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate(`/auth?lang=${language}`);
    }
  };

  // Override some translations with corrected capitalization
  const correctedTranslations = {
    ...translations,
    heroTitle: language === 'el' ? 'Το ταξίδι του πρωταθλητή' : 'The champion\'s journey',
    heroSubtitle: language === 'el' ? 'Ξεκινάει εδώ' : 'Starts here',
    explorePrograms: language === 'el' ? 'Εξερεύνηση όλων των προγραμμάτων' : 'Explore all programs',
    supportingYour: language === 'el' ? 'Υποστηρίζοντας το' : 'Supporting your',
    athleticJourney: language === 'el' ? 'Αθλητικό σας ταξίδι' : 'Athletic journey',
    headCoach: language === 'el' ? 'Κύριος προπονητής' : 'Head coach',
    ourVision: language === 'el' ? 'Το όραμά μας' : 'Our vision',
    trainingMethodology: language === 'el' ? 'Μεθοδολογία προπόνησης' : 'Training methodology',
    // Updated translations for About section
    academicBackground: language === 'el' ? 'Ακαδημαϊκό υπόβαθρο' : 'Academic background',
    professionalAthlete: language === 'el' ? 'Επαγγελματίας αθλητής' : 'Professional athlete',
    coreValues: language === 'el' ? 'Βασικές αξίες' : 'Core values',
    moreThanPhysical: language === 'el' ? 'Περισσότερο από σωματική άσκηση' : 'More than physical',
    buildingCharacter: language === 'el' ? 'Χτίσιμο χαρακτήρα' : 'Building character',
    trustTheProcess: language === 'el' ? 'Εμπιστοσύνη στη διαδικασία' : 'Trust the process',
    movementSkills: language === 'el' ? 'Κινητικές δεξιότητες' : 'Movement skills',
    resultsFocused: language === 'el' ? 'Εστιασμένα στα αποτελέσματα' : 'Results focused'
  };

  const navigationItems = [
    { name: correctedTranslations.home, href: "#home" },
    { name: correctedTranslations.programs, href: "#programs" },
    { name: correctedTranslations.about, href: "#about" },
    { name: correctedTranslations.blog, href: "#blog" },
    { name: correctedTranslations.results, href: "#results" },
    { name: correctedTranslations.contact, href: "#footer" }
  ];

  const programs = [
    {
      id: "10",
      title: translations.hyperkids,
      description: "Χτίζοντας αθλητικές βάσεις για όλα τα σπορ",
      image: "/lovable-uploads/d049bee3-9df6-4a4b-8aff-88a05957d3ba.png",
      color: "#00ffba"
    },
    {
      id: "11", 
      title: translations.hypergym,
      description: translations.hypergymDesc,
      image: hypergymImage,
      color: "#00ffba"
    },
    {
      id: "13", 
      title: translations.hyperathletes,
      description: translations.hyperathletesDesc,
      image: "/lovable-uploads/b06a27cc-1f96-43d1-a89c-ea4330c70290.png",
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

      <CertificatesSection translations={correctedTranslations} />

      <EliteTrainingSection
        translations={correctedTranslations}
      />

      <LiveProgramSection
        translations={correctedTranslations}
      />

      <BlogSection 
        translations={correctedTranslations}
      />

      <ResultsSection 
        translations={correctedTranslations}
      />

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-black mb-6">
            {correctedTranslations.readyQuestion}
          </h2>
          <p className="text-xl text-black max-w-3xl mx-auto mb-8">
            {correctedTranslations.journeyText}
          </p>
          <button 
            className="bg-black px-8 py-4 text-lg font-semibold hover:bg-gray-800 transition-colors text-white"
            onClick={handleGetStarted}
          >
            {correctedTranslations.startNow}
          </button>
        </div>
      </section>

      <Footer 
        translations={correctedTranslations}
      />
    </div>
  );
};

export default Index;
