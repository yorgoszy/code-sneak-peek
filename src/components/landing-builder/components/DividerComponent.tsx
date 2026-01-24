import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DividerComponentProps {
  height?: number;
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted';
  marginTop?: number;
  marginBottom?: number;
  width?: string;
}

export const DividerComponent: UserComponent<DividerComponentProps> = ({
  height = 1,
  color = '#e5e7eb',
  style = 'solid',
  marginTop = 16,
  marginBottom = 16,
  width = '100%'
}) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected
  }));

  return (
    <hr
      ref={(ref) => ref && connect(drag(ref))}
      style={{
        borderTop: `${height}px ${style} ${color}`,
        borderBottom: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        width
      }}
      className={`cursor-grab ${selected ? 'outline outline-2 outline-primary outline-dashed' : ''}`}
    />
  );
};

const DividerSettings = () => {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props
  }));

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm">Height (px)</Label>
        <Input
          type="number"
          value={props.height || 1}
          onChange={(e) => setProp((props: DividerComponentProps) => props.height = parseInt(e.target.value))}
          className="rounded-none mt-1"
        />
      </div>
      
      <div>
        <Label className="text-sm">Color</Label>
        <Input
          type="color"
          value={props.color || '#e5e7eb'}
          onChange={(e) => setProp((props: DividerComponentProps) => props.color = e.target.value)}
          className="rounded-none mt-1 h-10"
        />
      </div>

      <div>
        <Label className="text-sm">Style</Label>
        <Select 
          value={props.style || 'solid'} 
          onValueChange={(val) => setProp((props: DividerComponentProps) => props.style = val as 'solid' | 'dashed' | 'dotted')}
        >
          <SelectTrigger className="rounded-none mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="solid">Solid</SelectItem>
            <SelectItem value="dashed">Dashed</SelectItem>
            <SelectItem value="dotted">Dotted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm">Margin Top (px)</Label>
        <Input
          type="number"
          value={props.marginTop || 16}
          onChange={(e) => setProp((props: DividerComponentProps) => props.marginTop = parseInt(e.target.value))}
          className="rounded-none mt-1"
        />
      </div>

      <div>
        <Label className="text-sm">Margin Bottom (px)</Label>
        <Input
          type="number"
          value={props.marginBottom || 16}
          onChange={(e) => setProp((props: DividerComponentProps) => props.marginBottom = parseInt(e.target.value))}
          className="rounded-none mt-1"
        />
      </div>

      <div>
        <Label className="text-sm">Width</Label>
        <Input
          type="text"
          value={props.width || '100%'}
          onChange={(e) => setProp((props: DividerComponentProps) => props.width = e.target.value)}
          placeholder="100% or 200px"
          className="rounded-none mt-1"
        />
      </div>
    </div>
  );
};

DividerComponent.craft = {
  props: {
    height: 1,
    color: '#e5e7eb',
    style: 'solid',
    marginTop: 16,
    marginBottom: 16,
    width: '100%'
  },
  displayName: 'Divider',
  related: {
    settings: DividerSettings
  }
};
