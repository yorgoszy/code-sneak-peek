import React from 'react';
import { useEditor, Element } from '@craftjs/core';
import { 
  Type, 
  Image, 
  Square, 
  Heading1, 
  Grid3X3, 
  Minus, 
  Star,
  Palette,
  MousePointerClick,
  Layout,
  Navigation,
  ImagePlay,
  Users,
  Info,
  Award,
  Zap,
  Calendar,
  BookOpen,
  Trophy,
  Megaphone,
  Mail
} from 'lucide-react';
import { 
  ContainerComponent, 
  TextComponent, 
  ImageComponent, 
  ButtonComponent,
  HeadingComponent,
  SectionComponent,
  GridComponent,
  DividerComponent,
  IconComponent,
  GradientBoxComponent
} from './components';
import {
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
} from './landing-sections';
import { cn } from '@/lib/utils';

interface ToolboxItemProps {
  icon: React.ReactNode;
  label: string;
  create: () => React.ReactElement;
}

const ToolboxItem: React.FC<ToolboxItemProps> = ({ icon, label, create }) => {
  const { connectors } = useEditor();

  return (
    <div
      ref={(ref) => ref && connectors.create(ref, create())}
      className={cn(
        "flex flex-col items-center justify-center p-3 border border-border rounded-none",
        "cursor-grab hover:bg-accent hover:border-primary transition-colors",
        "bg-card text-foreground"
      )}
    >
      {icon}
      <span className="text-xs mt-1 text-center">{label}</span>
    </div>
  );
};

export const LandingBuilderToolbox: React.FC = () => {
  const basicItems: ToolboxItemProps[] = [
    {
      icon: <Layout className="w-6 h-6" />,
      label: "Container",
      create: () => <Element is={ContainerComponent} canvas />
    },
    {
      icon: <Square className="w-6 h-6" />,
      label: "Section",
      create: () => <Element is={SectionComponent} canvas />
    },
    {
      icon: <Grid3X3 className="w-6 h-6" />,
      label: "Grid",
      create: () => <Element is={GridComponent} columns={2} canvas />
    },
    {
      icon: <Heading1 className="w-6 h-6" />,
      label: "Heading",
      create: () => <HeadingComponent text="Επικεφαλίδα" level="h2" />
    },
    {
      icon: <Type className="w-6 h-6" />,
      label: "Text",
      create: () => <TextComponent text="Κείμενο εδώ..." />
    },
    {
      icon: <Image className="w-6 h-6" />,
      label: "Image",
      create: () => <ImageComponent src="" alt="Image" />
    },
    {
      icon: <MousePointerClick className="w-6 h-6" />,
      label: "Button",
      create: () => <ButtonComponent text="Button" />
    },
    {
      icon: <Minus className="w-6 h-6" />,
      label: "Divider",
      create: () => <DividerComponent />
    },
    {
      icon: <Star className="w-6 h-6" />,
      label: "Icon",
      create: () => <IconComponent icon="star" />
    },
    {
      icon: <Palette className="w-6 h-6" />,
      label: "Gradient",
      create: () => <Element is={GradientBoxComponent} canvas />
    }
  ];

  const landingSections: ToolboxItemProps[] = [
    {
      icon: <Navigation className="w-6 h-6" />,
      label: "Navigation",
      create: () => <NavigationSectionComponent />
    },
    {
      icon: <ImagePlay className="w-6 h-6" />,
      label: "Hero",
      create: () => <HeroSectionComponent />
    },
    {
      icon: <Users className="w-6 h-6" />,
      label: "Programs",
      create: () => <ProgramsSectionComponent />
    },
    {
      icon: <Info className="w-6 h-6" />,
      label: "About",
      create: () => <AboutSectionComponent />
    },
    {
      icon: <Award className="w-6 h-6" />,
      label: "Certificates",
      create: () => <CertificatesSectionComponent />
    },
    {
      icon: <Zap className="w-6 h-6" />,
      label: "Elite Training",
      create: () => <EliteTrainingSectionComponent />
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      label: "Live Program",
      create: () => <LiveProgramSectionComponent />
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      label: "Blog",
      create: () => <BlogSectionComponent />
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      label: "Results",
      create: () => <ResultsSectionComponent />
    },
    {
      icon: <Megaphone className="w-6 h-6" />,
      label: "CTA",
      create: () => <CTASectionComponent />
    },
    {
      icon: <Mail className="w-6 h-6" />,
      label: "Footer",
      create: () => <FooterSectionComponent />
    }
  ];

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-4 text-foreground">Landing Sections</h3>
        <div className="grid grid-cols-2 gap-2">
          {landingSections.map((item, index) => (
            <ToolboxItem key={`landing-${index}`} {...item} />
          ))}
        </div>
      </div>
      
      <div className="border-t border-border pt-4">
        <h3 className="font-semibold text-lg mb-4 text-foreground">Basic Components</h3>
        <div className="grid grid-cols-2 gap-2">
          {basicItems.map((item, index) => (
            <ToolboxItem key={`basic-${index}`} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
};
