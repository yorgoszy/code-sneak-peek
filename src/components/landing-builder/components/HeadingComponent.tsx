import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HeadingComponentProps {
  text: string;
  level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontFamily?: string;
}

const fontSizes = {
  h1: '48px',
  h2: '36px',
  h3: '28px',
  h4: '24px',
  h5: '20px',
  h6: '18px'
};

export const HeadingComponent: UserComponent<HeadingComponentProps> = ({
  text = 'Heading',
  level = 'h2',
  color = '#000000',
  textAlign = 'left',
  fontFamily = 'inherit'
}) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected
  }));

  const HeadingTag = level;

  return (
    <HeadingTag
      ref={(ref: any) => ref && connect(drag(ref))}
      style={{
        fontSize: fontSizes[level],
        color,
        textAlign,
        fontFamily,
        fontWeight: 'bold',
        margin: 0
      }}
      className={`cursor-grab ${selected ? 'outline outline-2 outline-primary outline-dashed' : ''}`}
    >
      {text}
    </HeadingTag>
  );
};

const HeadingSettings = () => {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props
  }));

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm">Heading Text</Label>
        <Input
          type="text"
          value={props.text || 'Heading'}
          onChange={(e) => setProp((props: HeadingComponentProps) => props.text = e.target.value)}
          className="rounded-none mt-1"
        />
      </div>
      
      <div>
        <Label className="text-sm">Level</Label>
        <Select 
          value={props.level || 'h2'} 
          onValueChange={(val) => setProp((props: HeadingComponentProps) => props.level = val as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6')}
        >
          <SelectTrigger className="rounded-none mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="h1">H1 - 48px</SelectItem>
            <SelectItem value="h2">H2 - 36px</SelectItem>
            <SelectItem value="h3">H3 - 28px</SelectItem>
            <SelectItem value="h4">H4 - 24px</SelectItem>
            <SelectItem value="h5">H5 - 20px</SelectItem>
            <SelectItem value="h6">H6 - 18px</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm">Color</Label>
        <Input
          type="color"
          value={props.color || '#000000'}
          onChange={(e) => setProp((props: HeadingComponentProps) => props.color = e.target.value)}
          className="rounded-none mt-1 h-10"
        />
      </div>

      <div>
        <Label className="text-sm">Text Align</Label>
        <Select 
          value={props.textAlign || 'left'} 
          onValueChange={(val) => setProp((props: HeadingComponentProps) => props.textAlign = val as 'left' | 'center' | 'right')}
        >
          <SelectTrigger className="rounded-none mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

HeadingComponent.craft = {
  props: {
    text: 'Επικεφαλίδα',
    level: 'h2',
    color: '#000000',
    textAlign: 'left',
    fontFamily: 'inherit'
  },
  displayName: 'Heading',
  related: {
    settings: HeadingSettings
  }
};
