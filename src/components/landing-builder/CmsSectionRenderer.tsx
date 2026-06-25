import React from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import HeroSection from '@/components/landing/HeroSection';
import ProgramsSection from '@/components/landing/ProgramsSection';
import AboutSection from '@/components/landing/AboutSection';
import CertificatesSection from '@/components/landing/CertificatesSection';
import EliteTrainingSection from '@/components/landing/EliteTrainingSection';
import LiveProgramSection from '@/components/landing/LiveProgramSection';
import LiveMatchesSection from '@/components/landing/LiveMatchesSection';
import VideoGallerySection from '@/components/landing/VideoGallerySection';
import BlogSection from '@/components/landing/BlogSection';
import ResultsSection from '@/components/landing/ResultsSection';
import GiftCardSection from '@/components/landing/GiftCardSection';
import Footer from '@/components/landing/Footer';

export type CmsSectionKey =
  | 'hero' | 'programs' | 'about' | 'certificates' | 'elite' | 'liveProgram'
  | 'liveMatches' | 'videoGallery' | 'blog' | 'results' | 'giftCard' | 'footer';

export const CMS_SECTION_OPTIONS: { key: CmsSectionKey; label: string }[] = [
  { key: 'hero', label: 'Hero' },
  { key: 'programs', label: 'Programs' },
  { key: 'about', label: 'About' },
  { key: 'certificates', label: 'Certificates' },
  { key: 'elite', label: 'Elite Training' },
  { key: 'liveProgram', label: 'Live Program' },
  { key: 'liveMatches', label: 'Live Matches' },
  { key: 'videoGallery', label: 'Video Gallery' },
  { key: 'blog', label: 'Blog' },
  { key: 'results', label: 'Results' },
  { key: 'giftCard', label: 'Gift Card' },
  { key: 'footer', label: 'Footer' },
];

interface Props {
  sectionKey?: CmsSectionKey;
  editorMode?: boolean;
}

const noop = () => {};

const Placeholder: React.FC<{ label: string }> = ({ label }) => (
  <div className="p-6 border border-dashed border-border bg-muted/30 text-sm text-muted-foreground text-center">
    Επίλεξε section από το Inspector — τώρα: <strong>{label}</strong>
  </div>
);

export const CmsSectionRenderer: React.FC<Props> = ({ sectionKey, editorMode }) => {
  const { translations, language } = useTranslations();
  const t = { ...translations, language } as any;

  if (!sectionKey) return <Placeholder label="(no section selected)" />;

  try {
    switch (sectionKey) {
      case 'hero':
        return <HeroSection translations={t} onGetStarted={noop} />;
      case 'programs':
        return <ProgramsSection programs={[] as any} translations={t} />;
      case 'about':
        return <AboutSection translations={t} />;
      case 'certificates':
        return <CertificatesSection translations={t} />;
      case 'elite':
        return <EliteTrainingSection translations={t} />;
      case 'liveProgram':
        return <LiveProgramSection translations={t} />;
      case 'liveMatches':
        return <LiveMatchesSection translations={t} />;
      case 'videoGallery':
        return <VideoGallerySection translations={t} />;
      case 'blog':
        return <BlogSection translations={t} />;
      case 'results':
        return <ResultsSection translations={t} />;
      case 'giftCard':
        return <GiftCardSection translations={t} />;
      case 'footer':
        return <Footer translations={t} />;
      default:
        return <Placeholder label={sectionKey} />;
    }
  } catch (e: any) {
    return (
      <div className="p-4 border border-destructive bg-destructive/10 text-xs">
        CMS section <strong>{sectionKey}</strong> failed: {String(e?.message ?? e)}
      </div>
    );
  }
};

export default CmsSectionRenderer;
