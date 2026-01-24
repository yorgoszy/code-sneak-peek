import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GradientBoxComponentProps {
  gradientFrom?: string;
  gradientTo?: string;
  gradientDirection?: string;
  padding?: number;
  minHeight?: number;
  children?: React.ReactNode;
}

export const GradientBoxComponent: UserComponent<GradientBoxComponentProps> = ({
  gradientFrom = '#00ffba',
  gradientTo = '#cb8954',
  gradientDirection = 'to right',
  padding = 32,
  minHeight = 200,
  children
}) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected
  }));

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      style={{
        background: `linear-gradient(${gradientDirection}, ${gradientFrom}, ${gradientTo})`,
        padding: `${padding}px`,
        minHeight: `${minHeight}px`
      }}
      className={`${selected ? 'outline outline-2 outline-primary outline-dashed' : ''}`}
    >
      {children}
    </div>
  );
};

const GradientBoxSettings = () => {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props
  }));

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm">Color From</Label>
        <Input
          type="color"
          value={props.gradientFrom || '#00ffba'}
          onChange={(e) => setProp((props: GradientBoxComponentProps) => props.gradientFrom = e.target.value)}
          className="rounded-none mt-1 h-10"
        />
      </div>
      
      <div>
        <Label className="text-sm">Color To</Label>
        <Input
          type="color"
          value={props.gradientTo || '#cb8954'}
          onChange={(e) => setProp((props: GradientBoxComponentProps) => props.gradientTo = e.target.value)}
          className="rounded-none mt-1 h-10"
        />
      </div>

      <div>
        <Label className="text-sm">Direction</Label>
        <Select 
          value={props.gradientDirection || 'to right'} 
          onValueChange={(val) => setProp((props: GradientBoxComponentProps) => props.gradientDirection = val)}
        >
          <SelectTrigger className="rounded-none mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="to right">Horizontal →</SelectItem>
            <SelectItem value="to left">Horizontal ←</SelectItem>
            <SelectItem value="to bottom">Vertical ↓</SelectItem>
            <SelectItem value="to top">Vertical ↑</SelectItem>
            <SelectItem value="to bottom right">Diagonal ↘</SelectItem>
            <SelectItem value="to bottom left">Diagonal ↙</SelectItem>
            <SelectItem value="to top right">Diagonal ↗</SelectItem>
            <SelectItem value="to top left">Diagonal ↖</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm">Padding (px)</Label>
        <Input
          type="number"
          value={props.padding || 32}
          onChange={(e) => setProp((props: GradientBoxComponentProps) => props.padding = parseInt(e.target.value))}
          className="rounded-none mt-1"
        />
      </div>

      <div>
        <Label className="text-sm">Min Height (px)</Label>
        <Input
          type="number"
          value={props.minHeight || 200}
          onChange={(e) => setProp((props: GradientBoxComponentProps) => props.minHeight = parseInt(e.target.value))}
          className="rounded-none mt-1"
        />
      </div>
    </div>
  );
};

GradientBoxComponent.craft = {
  props: {
    gradientFrom: '#00ffba',
    gradientTo: '#cb8954',
    gradientDirection: 'to right',
    padding: 32,
    minHeight: 200
  },
  displayName: 'Gradient Box',
  related: {
    settings: GradientBoxSettings
  }
};
