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
  Layout
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
  const items: ToolboxItemProps[] = [
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

  return (
    <div className="p-4">
      <h3 className="font-semibold text-lg mb-4 text-foreground">Components</h3>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item, index) => (
          <ToolboxItem key={index} {...item} />
        ))}
      </div>
    </div>
  );
};
