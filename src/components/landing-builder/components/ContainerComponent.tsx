import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ContainerComponentProps {
  background?: string;
  padding?: number;
  children?: React.ReactNode;
  flexDirection?: 'row' | 'column';
  justifyContent?: string;
  alignItems?: string;
  gap?: number;
  minHeight?: number;
}

export const ContainerComponent: UserComponent<ContainerComponentProps> = ({
  background = 'transparent',
  padding = 16,
  children,
  flexDirection = 'column',
  justifyContent = 'flex-start',
  alignItems = 'stretch',
  gap = 8,
  minHeight = 100
}) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected
  }));

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      style={{
        background,
        padding: `${padding}px`,
        display: 'flex',
        flexDirection,
        justifyContent,
        alignItems,
        gap: `${gap}px`,
        minHeight: `${minHeight}px`
      }}
      className={`${selected ? 'outline outline-2 outline-primary outline-dashed' : ''}`}
    >
      {children}
    </div>
  );
};

const ContainerSettings = () => {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props
  }));

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm">Background</Label>
        <Input
          type="text"
          value={props.background || 'transparent'}
          onChange={(e) => setProp((props: ContainerComponentProps) => props.background = e.target.value)}
          placeholder="#ffffff or transparent"
          className="rounded-none mt-1"
        />
      </div>
      
      <div>
        <Label className="text-sm">Padding (px)</Label>
        <Input
          type="number"
          value={props.padding || 16}
          onChange={(e) => setProp((props: ContainerComponentProps) => props.padding = parseInt(e.target.value))}
          className="rounded-none mt-1"
        />
      </div>

      <div>
        <Label className="text-sm">Direction</Label>
        <Select 
          value={props.flexDirection || 'column'} 
          onValueChange={(val) => setProp((props: ContainerComponentProps) => props.flexDirection = val as 'row' | 'column')}
        >
          <SelectTrigger className="rounded-none mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="column">Vertical</SelectItem>
            <SelectItem value="row">Horizontal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm">Gap (px)</Label>
        <Input
          type="number"
          value={props.gap || 8}
          onChange={(e) => setProp((props: ContainerComponentProps) => props.gap = parseInt(e.target.value))}
          className="rounded-none mt-1"
        />
      </div>

      <div>
        <Label className="text-sm">Min Height (px)</Label>
        <Input
          type="number"
          value={props.minHeight || 100}
          onChange={(e) => setProp((props: ContainerComponentProps) => props.minHeight = parseInt(e.target.value))}
          className="rounded-none mt-1"
        />
      </div>
    </div>
  );
};

ContainerComponent.craft = {
  props: {
    background: 'transparent',
    padding: 16,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    gap: 8,
    minHeight: 100
  },
  displayName: 'Container',
  related: {
    settings: ContainerSettings
  }
};
