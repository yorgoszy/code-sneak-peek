import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import sessionServicesBg from '@/assets/session-services-bg.png';

interface ProgramsSectionProps {
  title: string;
  paragraph1: string;
  paragraph2: string;
  textColor: string;
  titleFontSize: number;
  paragraphFontSize: number;
  horizontalPosition: 'left' | 'center' | 'right';
  verticalPosition: 'top' | 'center' | 'bottom';
  offsetX: number;
  offsetY: number;
  opacity: number;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right';
}

export const ProgramsSectionComponent: UserComponent<ProgramsSectionProps> = ({
  title,
  paragraph1,
  paragraph2,
  textColor,
  titleFontSize,
  paragraphFontSize,
  horizontalPosition,
  verticalPosition,
  offsetX,
  offsetY,
  opacity,
  fontFamily,
  textAlign
}) => {
  const { connectors: { connect, drag } } = useNode();

  // Calculate position styles based on horizontal and vertical position
  const getPositionStyles = () => {
    const styles: React.CSSProperties = {
      position: 'absolute',
      opacity: opacity / 100,
      maxWidth: '500px',
      padding: '20px'
    };

    // Horizontal positioning
    if (horizontalPosition === 'left') {
      styles.left = `${offsetX}px`;
    } else if (horizontalPosition === 'center') {
      styles.left = '50%';
      styles.transform = 'translateX(-50%)';
    } else {
      styles.right = `${offsetX}px`;
    }

    // Vertical positioning
    if (verticalPosition === 'top') {
      styles.top = `${offsetY}px`;
    } else if (verticalPosition === 'center') {
      styles.top = '50%';
      styles.transform = horizontalPosition === 'center' 
        ? 'translate(-50%, -50%)' 
        : 'translateY(-50%)';
    } else {
      styles.bottom = `${offsetY}px`;
    }

    return styles;
  };

  return (
    <div 
      ref={(ref) => ref && connect(drag(ref))}
      className="relative"
    >
      <section id="programs" className="relative">
        <img 
          src={sessionServicesBg} 
          alt="Session Services" 
          className="w-full h-auto"
        />
        <div style={getPositionStyles()}>
          <div 
            style={{ 
              color: textColor,
              fontFamily: fontFamily,
              textAlign: textAlign
            }}
          >
            <h2 
              className="font-bold mb-4"
              style={{ fontSize: `${titleFontSize}px` }}
            >
              {title}
            </h2>
            <p 
              className="leading-relaxed"
              style={{ fontSize: `${paragraphFontSize}px` }}
            >
              {paragraph1}
            </p>
            <p 
              className="mt-4 font-medium"
              style={{ fontSize: `${paragraphFontSize}px` }}
            >
              {paragraph2}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

const ProgramsSectionSettings = () => {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props as ProgramsSectionProps
  }));

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-bold">Κείμενο</Label>
      </div>
      
      <div>
        <Label className="text-sm">Τίτλος</Label>
        <Input
          value={props.title}
          onChange={(e) => setProp((p: ProgramsSectionProps) => p.title = e.target.value)}
          className="rounded-none mt-1"
        />
      </div>

      <div>
        <Label className="text-sm">Παράγραφος 1</Label>
        <Textarea
          value={props.paragraph1}
          onChange={(e) => setProp((p: ProgramsSectionProps) => p.paragraph1 = e.target.value)}
          className="rounded-none mt-1"
          rows={3}
        />
      </div>

      <div>
        <Label className="text-sm">Παράγραφος 2</Label>
        <Textarea
          value={props.paragraph2}
          onChange={(e) => setProp((p: ProgramsSectionProps) => p.paragraph2 = e.target.value)}
          className="rounded-none mt-1"
          rows={2}
        />
      </div>

      <div className="border-t pt-4">
        <Label className="text-sm font-bold">Στυλ Κειμένου</Label>
      </div>

      <div>
        <Label className="text-sm">Χρώμα κειμένου</Label>
        <Input
          type="color"
          value={props.textColor}
          onChange={(e) => setProp((p: ProgramsSectionProps) => p.textColor = e.target.value)}
          className="rounded-none mt-1 h-10"
        />
      </div>

      <div>
        <Label className="text-sm">Μέγεθος τίτλου: {props.titleFontSize}px</Label>
        <Slider
          value={[props.titleFontSize]}
          onValueChange={(val) => setProp((p: ProgramsSectionProps) => p.titleFontSize = val[0])}
          min={16}
          max={72}
          step={1}
          className="mt-2"
        />
      </div>

      <div>
        <Label className="text-sm">Μέγεθος παραγράφων: {props.paragraphFontSize}px</Label>
        <Slider
          value={[props.paragraphFontSize]}
          onValueChange={(val) => setProp((p: ProgramsSectionProps) => p.paragraphFontSize = val[0])}
          min={10}
          max={32}
          step={1}
          className="mt-2"
        />
      </div>

      <div>
        <Label className="text-sm">Στοίχιση κειμένου</Label>
        <Select 
          value={props.textAlign} 
          onValueChange={(val) => setProp((p: ProgramsSectionProps) => p.textAlign = val as 'left' | 'center' | 'right')}
        >
          <SelectTrigger className="rounded-none mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="left">Αριστερά</SelectItem>
            <SelectItem value="center">Κέντρο</SelectItem>
            <SelectItem value="right">Δεξιά</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm">Γραμματοσειρά</Label>
        <Select 
          value={props.fontFamily} 
          onValueChange={(val) => setProp((p: ProgramsSectionProps) => p.fontFamily = val)}
        >
          <SelectTrigger className="rounded-none mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="inherit">Default</SelectItem>
            <SelectItem value="'Robert Pro', sans-serif">Robert Pro</SelectItem>
            <SelectItem value="Arial, sans-serif">Arial</SelectItem>
            <SelectItem value="Georgia, serif">Georgia</SelectItem>
            <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border-t pt-4">
        <Label className="text-sm font-bold">Θέση Κειμένου</Label>
      </div>

      <div>
        <Label className="text-sm">Οριζόντια θέση</Label>
        <Select 
          value={props.horizontalPosition} 
          onValueChange={(val) => setProp((p: ProgramsSectionProps) => p.horizontalPosition = val as 'left' | 'center' | 'right')}
        >
          <SelectTrigger className="rounded-none mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="left">Αριστερά</SelectItem>
            <SelectItem value="center">Κέντρο</SelectItem>
            <SelectItem value="right">Δεξιά</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm">Κάθετη θέση</Label>
        <Select 
          value={props.verticalPosition} 
          onValueChange={(val) => setProp((p: ProgramsSectionProps) => p.verticalPosition = val as 'top' | 'center' | 'bottom')}
        >
          <SelectTrigger className="rounded-none mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="top">Πάνω</SelectItem>
            <SelectItem value="center">Κέντρο</SelectItem>
            <SelectItem value="bottom">Κάτω</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm">Οριζόντια απόσταση: {props.offsetX}px</Label>
        <Slider
          value={[props.offsetX]}
          onValueChange={(val) => setProp((p: ProgramsSectionProps) => p.offsetX = val[0])}
          min={0}
          max={300}
          step={10}
          className="mt-2"
        />
      </div>

      <div>
        <Label className="text-sm">Κάθετη απόσταση: {props.offsetY}px</Label>
        <Slider
          value={[props.offsetY]}
          onValueChange={(val) => setProp((p: ProgramsSectionProps) => p.offsetY = val[0])}
          min={0}
          max={300}
          step={10}
          className="mt-2"
        />
      </div>

      <div>
        <Label className="text-sm">Διαφάνεια: {props.opacity}%</Label>
        <Slider
          value={[props.opacity]}
          onValueChange={(val) => setProp((p: ProgramsSectionProps) => p.opacity = val[0])}
          min={0}
          max={100}
          step={5}
          className="mt-2"
        />
      </div>
    </div>
  );
};

ProgramsSectionComponent.craft = {
  displayName: 'Programs Section',
  props: {
    title: 'Δεξιότητες ή σπορ',
    paragraph1: 'Τα παιδιά πρέπει να είναι επιδέξια. Η κίνηση είναι ένα φυσικό προβάδισμα που δεν πρέπει να χάσουν.',
    paragraph2: 'Εμείς τους δίνουμε τα εργαλεία να το αξιοποιήσουν.',
    textColor: '#ffffff',
    titleFontSize: 30,
    paragraphFontSize: 14,
    horizontalPosition: 'right',
    verticalPosition: 'top',
    offsetX: 148,
    offsetY: 252,
    opacity: 100,
    fontFamily: 'inherit',
    textAlign: 'left'
  },
  related: {
    settings: ProgramsSectionSettings
  }
};
