import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TextComponentProps {
  text: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontFamily?: string;
}

export const TextComponent: UserComponent<TextComponentProps> = ({
  text = 'Text here...',
  fontSize = 16,
  fontWeight = 'normal',
  color = '#000000',
  textAlign = 'left',
  fontFamily = 'inherit'
}) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected
  }));

  return (
    <p
      ref={(ref) => ref && connect(drag(ref))}
      style={{
        fontSize: `${fontSize}px`,
        fontWeight,
        color,
        textAlign,
        fontFamily,
        margin: 0
      }}
      className={`cursor-grab ${selected ? 'outline outline-2 outline-primary outline-dashed' : ''}`}
    >
      {text}
    </p>
  );
};

const TextSettings = () => {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props
  }));

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm">Text Content</Label>
        <Textarea
          value={props.text}
          onChange={(e) => setProp((props: TextComponentProps) => props.text = e.target.value)}
          className="rounded-none mt-1"
          rows={3}
        />
      </div>
      
      <div>
        <Label className="text-sm">Font Size (px)</Label>
        <Input
          type="number"
          value={props.fontSize || 16}
          onChange={(e) => setProp((props: TextComponentProps) => props.fontSize = parseInt(e.target.value))}
          className="rounded-none mt-1"
        />
      </div>

      <div>
        <Label className="text-sm">Font Weight</Label>
        <Select 
          value={props.fontWeight || 'normal'} 
          onValueChange={(val) => setProp((props: TextComponentProps) => props.fontWeight = val)}
        >
          <SelectTrigger className="rounded-none mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="500">Medium</SelectItem>
            <SelectItem value="600">Semibold</SelectItem>
            <SelectItem value="bold">Bold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm">Color</Label>
        <Input
          type="color"
          value={props.color || '#000000'}
          onChange={(e) => setProp((props: TextComponentProps) => props.color = e.target.value)}
          className="rounded-none mt-1 h-10"
        />
      </div>

      <div>
        <Label className="text-sm">Text Align</Label>
        <Select 
          value={props.textAlign || 'left'} 
          onValueChange={(val) => setProp((props: TextComponentProps) => props.textAlign = val as 'left' | 'center' | 'right')}
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

TextComponent.craft = {
  props: {
    text: 'Κείμενο εδώ...',
    fontSize: 16,
    fontWeight: 'normal',
    color: '#000000',
    textAlign: 'left',
    fontFamily: 'inherit'
  },
  displayName: 'Text',
  related: {
    settings: TextSettings
  }
};
