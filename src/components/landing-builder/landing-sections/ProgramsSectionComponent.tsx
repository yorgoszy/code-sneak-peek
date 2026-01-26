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
  positionTop: number;
  positionRight: number;
  opacity: number;
  fontFamily: string;
}

export const ProgramsSectionComponent: UserComponent<ProgramsSectionProps> = ({
  title,
  paragraph1,
  paragraph2,
  textColor,
  titleFontSize,
  paragraphFontSize,
  positionTop,
  positionRight,
  opacity,
  fontFamily
}) => {
  const { connectors: { connect, drag } } = useNode();

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
        <div 
          className="absolute max-w-md"
          style={{ 
            top: `${positionTop}px`, 
            right: `${positionRight}px`,
            opacity: opacity / 100
          }}
        >
          <div 
            className="text-left"
            style={{ 
              color: textColor,
              fontFamily: fontFamily
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
        <Label className="text-sm">Θέση από πάνω: {props.positionTop}px</Label>
        <Slider
          value={[props.positionTop]}
          onValueChange={(val) => setProp((p: ProgramsSectionProps) => p.positionTop = val[0])}
          min={0}
          max={500}
          step={10}
          className="mt-2"
        />
      </div>

      <div>
        <Label className="text-sm">Θέση από δεξιά: {props.positionRight}px</Label>
        <Slider
          value={[props.positionRight]}
          onValueChange={(val) => setProp((p: ProgramsSectionProps) => p.positionRight = val[0])}
          min={0}
          max={500}
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
    positionTop: 252,
    positionRight: 148,
    opacity: 100,
    fontFamily: 'inherit'
  },
  related: {
    settings: ProgramsSectionSettings
  }
};
