import React, { useState } from 'react';
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
  Mail,
  ChevronDown
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ToolboxItemProps {
  icon: React.ReactNode;
  label: string;
  create: () => React.ReactElement;
}

const ToolboxItem: React.FC<ToolboxItemProps> = ({ icon, label, create }) => {
  const { connectors, actions, query } = useEditor();

  const handleClick = () => {
    const nodeTree = query.parseReactElement(create()).toNodeTree();
    actions.addNodeTree(nodeTree, 'ROOT');
  };

  return (
    <div
      ref={(ref) => ref && connectors.create(ref, create())}
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2 p-2 border border-border rounded-none",
        "cursor-pointer hover:bg-accent hover:border-primary transition-colors",
        "bg-card text-foreground text-xs"
      )}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
};

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-1 hover:bg-accent/50 transition-colors">
        <span className="font-semibold text-sm text-foreground">{title}</span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="py-2">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export const LandingBuilderToolbox: React.FC = () => {
  const basicItems: ToolboxItemProps[] = [
    {
      icon: <Layout className="w-4 h-4" />,
      label: "Container",
      create: () => <Element is={ContainerComponent} canvas />
    },
    {
      icon: <Square className="w-4 h-4" />,
      label: "Section",
      create: () => <Element is={SectionComponent} canvas />
    },
    {
      icon: <Grid3X3 className="w-4 h-4" />,
      label: "Grid",
      create: () => <Element is={GridComponent} columns={2} canvas />
    },
    {
      icon: <Heading1 className="w-4 h-4" />,
      label: "Heading",
      create: () => <HeadingComponent text="Επικεφαλίδα" level="h2" />
    },
    {
      icon: <Type className="w-4 h-4" />,
      label: "Text",
      create: () => <TextComponent text="Κείμενο εδώ..." />
    },
    {
      icon: <Image className="w-4 h-4" />,
      label: "Image",
      create: () => <ImageComponent src="" alt="Image" />
    },
    {
      icon: <MousePointerClick className="w-4 h-4" />,
      label: "Button",
      create: () => <ButtonComponent text="Button" />
    },
    {
      icon: <Minus className="w-4 h-4" />,
      label: "Divider",
      create: () => <DividerComponent />
    },
    {
      icon: <Star className="w-4 h-4" />,
      label: "Icon",
      create: () => <IconComponent icon="star" />
    },
    {
      icon: <Palette className="w-4 h-4" />,
      label: "Gradient",
      create: () => <Element is={GradientBoxComponent} canvas />
    }
  ];

  const landingSections: ToolboxItemProps[] = [
    {
      icon: <Navigation className="w-4 h-4" />,
      label: "Navigation",
      create: () => <NavigationSectionComponent />
    },
    {
      icon: <ImagePlay className="w-4 h-4" />,
      label: "Hero",
      create: () => <HeroSectionComponent />
    },
    {
      icon: <Users className="w-4 h-4" />,
      label: "Programs",
      create: () => <ProgramsSectionComponent 
        title="Δεξιότητες ή σπορ"
        paragraph1="Τα παιδιά πρέπει να είναι επιδέξια. Η κίνηση είναι ένα φυσικό προβάδισμα που δεν πρέπει να χάσουν."
        paragraph2="Εμείς τους δίνουμε τα εργαλεία να το αξιοποιήσουν."
        textColor="#ffffff"
        titleFontSize={30}
        paragraphFontSize={14}
        textX={500}
        textY={100}
        textWidth={400}
        textHeight={250}
        opacity={100}
        fontFamily="inherit"
        textAlign="left"
      />
    },
    {
      icon: <Info className="w-4 h-4" />,
      label: "About",
      create: () => <AboutSectionComponent />
    },
    {
      icon: <Award className="w-4 h-4" />,
      label: "Certificates",
      create: () => <CertificatesSectionComponent />
    },
    {
      icon: <Zap className="w-4 h-4" />,
      label: "Elite Training",
      create: () => <EliteTrainingSectionComponent />
    },
    {
      icon: <Calendar className="w-4 h-4" />,
      label: "Live Program",
      create: () => <LiveProgramSectionComponent />
    },
    {
      icon: <BookOpen className="w-4 h-4" />,
      label: "Blog",
      create: () => <BlogSectionComponent />
    },
    {
      icon: <Trophy className="w-4 h-4" />,
      label: "Results",
      create: () => <ResultsSectionComponent />
    },
    {
      icon: <Megaphone className="w-4 h-4" />,
      label: "CTA",
      create: () => <CTASectionComponent />
    },
    {
      icon: <Mail className="w-4 h-4" />,
      label: "Footer",
      create: () => <FooterSectionComponent />
    }
  ];

  return (
    <div className="p-3 space-y-1">
      <CollapsibleSection title="Landing Sections" defaultOpen={true}>
        <div className="grid grid-cols-1 gap-1">
          {landingSections.map((item, index) => (
            <ToolboxItem key={`landing-${index}`} {...item} />
          ))}
        </div>
      </CollapsibleSection>
      
      <div className="border-t border-border" />
      
      <CollapsibleSection title="Basic Components" defaultOpen={false}>
        <div className="grid grid-cols-1 gap-1">
          {basicItems.map((item, index) => (
            <ToolboxItem key={`basic-${index}`} {...item} />
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
};
