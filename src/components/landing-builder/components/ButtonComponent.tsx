import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ButtonComponentProps {
  text: string;
  backgroundColor?: string;
  textColor?: string;
  padding?: string;
  fontSize?: number;
  borderRadius?: number;
  href?: string;
  fullWidth?: boolean;
}

export const ButtonComponent: UserComponent<ButtonComponentProps> = ({
  text = 'Button',
  backgroundColor = '#00ffba',
  textColor = '#000000',
  padding = '12px 24px',
  fontSize = 16,
  borderRadius = 0,
  href = '',
  fullWidth = false
}) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected
  }));

  return (
    <button
      ref={(ref) => ref && connect(drag(ref))}
      style={{
        backgroundColor,
        color: textColor,
        padding,
        fontSize: `${fontSize}px`,
        borderRadius: `${borderRadius}px`,
        border: 'none',
        cursor: 'pointer',
        fontWeight: 600,
        width: fullWidth ? '100%' : 'auto',
        display: 'inline-block'
      }}
      className={`transition-opacity hover:opacity-90 ${selected ? 'outline outline-2 outline-primary outline-dashed' : ''}`}
    >
      {text}
    </button>
  );
};

const ButtonSettings = () => {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props
  }));

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm">Button Text</Label>
        <Input
          type="text"
          value={props.text || 'Button'}
          onChange={(e) => setProp((props: ButtonComponentProps) => props.text = e.target.value)}
          className="rounded-none mt-1"
        />
      </div>
      
      <div>
        <Label className="text-sm">Background Color</Label>
        <Input
          type="color"
          value={props.backgroundColor || '#00ffba'}
          onChange={(e) => setProp((props: ButtonComponentProps) => props.backgroundColor = e.target.value)}
          className="rounded-none mt-1 h-10"
        />
      </div>

      <div>
        <Label className="text-sm">Text Color</Label>
        <Input
          type="color"
          value={props.textColor || '#000000'}
          onChange={(e) => setProp((props: ButtonComponentProps) => props.textColor = e.target.value)}
          className="rounded-none mt-1 h-10"
        />
      </div>

      <div>
        <Label className="text-sm">Font Size (px)</Label>
        <Input
          type="number"
          value={props.fontSize || 16}
          onChange={(e) => setProp((props: ButtonComponentProps) => props.fontSize = parseInt(e.target.value))}
          className="rounded-none mt-1"
        />
      </div>

      <div>
        <Label className="text-sm">Padding</Label>
        <Input
          type="text"
          value={props.padding || '12px 24px'}
          onChange={(e) => setProp((props: ButtonComponentProps) => props.padding = e.target.value)}
          placeholder="12px 24px"
          className="rounded-none mt-1"
        />
      </div>

      <div>
        <Label className="text-sm">Border Radius (px)</Label>
        <Input
          type="number"
          value={props.borderRadius || 0}
          onChange={(e) => setProp((props: ButtonComponentProps) => props.borderRadius = parseInt(e.target.value))}
          className="rounded-none mt-1"
        />
      </div>

      <div>
        <Label className="text-sm">Link URL</Label>
        <Input
          type="text"
          value={props.href || ''}
          onChange={(e) => setProp((props: ButtonComponentProps) => props.href = e.target.value)}
          placeholder="https://..."
          className="rounded-none mt-1"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="fullWidth"
          checked={props.fullWidth || false}
          onChange={(e) => setProp((props: ButtonComponentProps) => props.fullWidth = e.target.checked)}
        />
        <Label htmlFor="fullWidth" className="text-sm">Full Width</Label>
      </div>
    </div>
  );
};

ButtonComponent.craft = {
  props: {
    text: 'Button',
    backgroundColor: '#00ffba',
    textColor: '#000000',
    padding: '12px 24px',
    fontSize: 16,
    borderRadius: 0,
    href: '',
    fullWidth: false
  },
  displayName: 'Button',
  related: {
    settings: ButtonSettings
  }
};
