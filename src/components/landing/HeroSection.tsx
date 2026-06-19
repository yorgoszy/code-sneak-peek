
import React from 'react';
import { Button } from "@/components/ui/button";
import { useLandingSection, localized, backgroundCss, type Lang } from "@/hooks/useLandingConfig";
import { useTranslations } from "@/hooks/useTranslations";
import { EditableText } from "./EditableText";

interface HeroSectionProps {
  translations: any;
  onGetStarted: () => void;
}

const DEFAULT_HERO_IMAGE = '/lovable-uploads/7d78ce26-3ce9-488f-9948-1cb90eac5b9e.png';

const HeroSection: React.FC<HeroSectionProps> = ({ translations, onGetStarted }) => {
  const cms = useLandingSection('hero');
  const { language } = useTranslations();
  const lang: Lang = language === 'en' ? 'en' : 'el';

  const handleContactClick = () => {
    const footerSection = document.getElementById('footer');
    if (footerSection) {
      footerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (cms && cms.is_visible === false) return null;

  const title = localized(cms, 'title', lang) || translations.heroTitle;
  const subtitle = localized(cms, 'subtitle', lang) || translations.heroSubtitle;
  const description = localized(cms, 'description', lang);
  const ctaLabel = translations.getStarted;
  const bgImage = cms?.image_url || DEFAULT_HERO_IMAGE;
  const gradient = backgroundCss(cms?.extra_data);
  const onCtaClick = () => {
    if (cms?.cta_url) {
      if (cms.cta_url.startsWith('#')) {
        const el = document.querySelector(cms.cta_url);
        el?.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.href = cms.cta_url;
      }
    } else {
      onGetStarted();
    }
  };

  return (
    <section id="home" className="relative pt-16 min-h-screen flex items-center">
      <style>{`
        .get-started-btn { background-color: #f4f1ea !important; color: black !important; }
        .get-started-btn:hover { background-color: #e5e5e5 !important; }
        .contact-btn:hover {
          border-color: #aca097 !important;
          color: #aca097 !important;
          background-color: transparent !important;
        }
      `}</style>

      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={gradient ? { background: gradient } : { backgroundImage: `url('${bgImage}')` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-left">
          <p className="text-[#f4f1ea]/70 text-xs sm:text-sm uppercase tracking-[0.2em] mb-3 font-medium">
            Est. 2024 — Thessaloniki
          </p>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl mb-6 text-[#f4f1ea] tracking-wide"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            {title}<br />
            <span className="text-[#f4f1ea]">{subtitle}</span>
          </h1>
          {description && (
            <p className="text-[#f4f1ea]/90 text-base sm:text-lg mb-6 max-w-2xl">
              {description}
            </p>
          )}
          <div className="flex flex-wrap gap-4">
            <Button
              className="get-started-btn rounded-none transition-colors duration-200"
              onClick={onCtaClick}
            >
              {ctaLabel}
            </Button>
            <Button
              variant="outline"
              className="contact-btn rounded-none bg-transparent text-[#f4f1ea] border-[#f4f1ea]"
              onClick={handleContactClick}
            >
              {translations.contactBtn}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

