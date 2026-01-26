import React, { useState } from 'react';
import { useNode, UserComponent } from '@craftjs/core';
import { Rnd } from 'react-rnd';
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
  textX: number;
  textY: number;
  textWidth: number;
  textHeight: number;
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
  textX,
  textY,
  textWidth,
  textHeight,
  opacity,
  fontFamily,
  textAlign
}) => {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const [isSelected, setIsSelected] = useState(false);

  return (
    <div 
      ref={(ref) => ref && connect(drag(ref))}
      className="relative"
      onClick={() => setIsSelected(true)}
    >
      <section id="programs" className="relative" style={{ minHeight: '400px' }}>
        <img 
          src={sessionServicesBg} 
          alt="Session Services" 
          className="w-full h-auto"
        />
        <div className="absolute inset-0">
          <Rnd
            size={{ width: textWidth, height: textHeight }}
            position={{ x: textX, y: textY }}
            onDragStop={(e, d) => {
              setProp((props: ProgramsSectionProps) => {
                props.textX = d.x;
                props.textY = d.y;
              });
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
              setProp((props: ProgramsSectionProps) => {
                props.textWidth = parseInt(ref.style.width);
                props.textHeight = parseInt(ref.style.height);
                props.textX = position.x;
                props.textY = position.y;
              });
            }}
            bounds="parent"
            className="cursor-move"
            style={{
              border: isSelected ? '2px dashed #00ffba' : '2px dashed transparent',
              background: isSelected ? 'rgba(0, 255, 186, 0.05)' : 'transparent',
            }}
            enableResizing={{
              top: true,
              right: true,
              bottom: true,
              left: true,
              topRight: true,
              bottomRight: true,
              bottomLeft: true,
              topLeft: true
            }}
          >
            <div 
              className="w-full h-full p-4"
              style={{ 
                color: textColor,
                fontFamily: fontFamily,
                textAlign: textAlign,
                opacity: opacity / 100
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
          </Rnd>
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
      <div className="bg-[#00ffba]/10 p-2 rounded-none text-xs text-center">
        💡 Σύρε το κείμενο στον canvas για να το μετακινήσεις!
      </div>

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
    textX: 500,
    textY: 100,
    textWidth: 400,
    textHeight: 250,
    opacity: 100,
    fontFamily: 'inherit',
    textAlign: 'left'
  },
  related: {
    settings: ProgramsSectionSettings
  }
};
