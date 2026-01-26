import React, { useEffect, useState } from 'react';
import { Editor, Frame, Element } from '@craftjs/core';
import { supabase } from '@/integrations/supabase/client';

// Import all components that can be used in layouts
import { ContainerComponent, TextComponent, ImageComponent, ButtonComponent, HeadingComponent, SectionComponent, GridComponent, DividerComponent, IconComponent, GradientBoxComponent } from '@/components/landing-builder/components';
import { NavigationSectionComponent } from '@/components/landing-builder/landing-sections/NavigationSectionComponent';
import { HeroSectionComponent } from '@/components/landing-builder/landing-sections/HeroSectionComponent';
import { ProgramsSectionComponent } from '@/components/landing-builder/landing-sections/ProgramsSectionComponent';
import { AboutSectionComponent } from '@/components/landing-builder/landing-sections/AboutSectionComponent';
import { CertificatesSectionComponent } from '@/components/landing-builder/landing-sections/CertificatesSectionComponent';
import { EliteTrainingSectionComponent } from '@/components/landing-builder/landing-sections/EliteTrainingSectionComponent';
import { LiveProgramSectionComponent } from '@/components/landing-builder/landing-sections/LiveProgramSectionComponent';
import { BlogSectionComponent } from '@/components/landing-builder/landing-sections/BlogSectionComponent';
import { ResultsSectionComponent } from '@/components/landing-builder/landing-sections/ResultsSectionComponent';
import { FooterSectionComponent } from '@/components/landing-builder/landing-sections/FooterSectionComponent';
import { CTASectionComponent } from '@/components/landing-builder/landing-sections/CTASectionComponent';

interface PublishedLandingRendererProps {
  fallback?: React.ReactNode;
}

export const PublishedLandingRenderer: React.FC<PublishedLandingRendererProps> = ({ fallback }) => {
  const [layoutData, setLayoutData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPublishedLayout, setHasPublishedLayout] = useState(false);

  const resolver = {
    ContainerComponent,
    TextComponent,
    ImageComponent,
    ButtonComponent,
    HeadingComponent,
    SectionComponent,
    GridComponent,
    DividerComponent,
    IconComponent,
    GradientBoxComponent,
    NavigationSectionComponent,
    HeroSectionComponent,
    ProgramsSectionComponent,
    AboutSectionComponent,
    CertificatesSectionComponent,
    EliteTrainingSectionComponent,
    LiveProgramSectionComponent,
    BlogSectionComponent,
    ResultsSectionComponent,
    FooterSectionComponent,
    CTASectionComponent
  };

  useEffect(() => {
    const fetchPublishedLayout = async () => {
      try {
        const { data, error } = await supabase
          .from('landing_page_layouts')
          .select('layout_data')
          .eq('is_published', true)
          .eq('is_active', true)
          .single();

        if (error) {
          console.log('No published layout found:', error.message);
          setHasPublishedLayout(false);
        } else if (data?.layout_data) {
          setLayoutData(JSON.stringify(data.layout_data));
          setHasPublishedLayout(true);
        }
      } catch (error) {
        console.error('Error fetching published layout:', error);
        setHasPublishedLayout(false);
      } finally {
        setLoading(false);
      }
    };

    fetchPublishedLayout();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    );
  }

  // If no published layout, show fallback (static components)
  if (!hasPublishedLayout || !layoutData) {
    return <>{fallback}</>;
  }

  // Render the published layout
  return (
    <Editor resolver={resolver} enabled={false}>
      <PublishedFrame layoutData={layoutData} />
    </Editor>
  );
};

// Separate component to use useEditor hook inside Editor context
const PublishedFrame: React.FC<{ layoutData: string }> = ({ layoutData }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="min-h-screen">
      <Frame data={layoutData}>
        <Element 
          is={ContainerComponent} 
          canvas
          background="transparent"
          padding={0}
          minHeight={100}
        />
      </Frame>
    </div>
  );
};

export default PublishedLandingRenderer;
