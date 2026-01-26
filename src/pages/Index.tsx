import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "@/hooks/useTranslations";
import { useIsPWA } from "@/hooks/useIsPWA";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/landing/Navigation";
import HeroSection from "@/components/landing/HeroSection";
import ProgramsSection from "@/components/landing/ProgramsSection";
import TrainingSection from "@/components/landing/TrainingSection";
import PlanningSection from "@/components/landing/PlanningSection";
import AboutSection from "@/components/landing/AboutSection";
import CoachCredentialsSection from "@/components/landing/CoachCredentialsSection";
import CertificatesSection from "@/components/landing/CertificatesSection";
import EliteTrainingSection from "@/components/landing/EliteTrainingSection";
import LiveProgramSection from "@/components/landing/LiveProgramSection";
import BlogSection from "@/components/landing/BlogSection";
import ResultsSection from "@/components/landing/ResultsSection";
import Footer from "@/components/landing/Footer";
import { PublishedLandingRenderer } from "@/components/landing/PublishedLandingRenderer";
import DevRulers from "@/components/dev/DevRulers";

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

  // Static fallback content (shown if no published layout exists)
  const staticContent = (
    <div className="min-h-screen bg-white font-robert">
      {/* Dev Rulers - remove in production */}
      <DevRulers />
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

      <ProgramsSection translations={correctedTranslations} />

      <TrainingSection />

      <PlanningSection />

      <AboutSection 
        translations={correctedTranslations}
        activeAboutSection={activeAboutSection}
        onSetActiveAboutSection={setActiveAboutSection}
      />

      <CoachCredentialsSection />

      <CertificatesSection translations={correctedTranslations} />

      <EliteTrainingSection translations={correctedTranslations} />

      <LiveProgramSection translations={correctedTranslations} />

      <BlogSection translations={correctedTranslations} />

      <ResultsSection translations={correctedTranslations} />

      <section className="py-20" style={{ backgroundColor: '#cb8954' }}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-black mb-6">
            {correctedTranslations.readyQuestion}
          </h2>
          <p className="text-xl text-black max-w-3xl mx-auto mb-8">
            {correctedTranslations.journeyText}
          </p>
          <button 
            className="bg-black px-8 py-4 text-lg font-semibold hover:bg-gray-800 transition-colors" 
            style={{ color: '#cb8954' }}
            onClick={handleGetStarted}
          >
            {correctedTranslations.startNow}
          </button>
        </div>
      </section>

      <Footer translations={correctedTranslations} />
    </div>
  );

  return <PublishedLandingRenderer fallback={staticContent} />;
};

export default Index;
