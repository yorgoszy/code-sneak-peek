import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as LucideIcons from 'lucide-react';

interface IconComponentProps {
  icon?: string;
  size?: number;
  color?: string;
}

const availableIcons = [
  'star', 'heart', 'check', 'x', 'plus', 'minus',
  'arrow-right', 'arrow-left', 'chevron-right', 'chevron-left',
  'user', 'users', 'settings', 'home', 'mail', 'phone',
  'calendar', 'clock', 'map-pin', 'globe', 'trophy', 'target',
  'zap', 'flame', 'shield', 'award', 'crown', 'sparkles'
];

const getIconComponent = (iconName: string) => {
  const pascalName = iconName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  
  return (LucideIcons as any)[pascalName] || LucideIcons.Star;
};

export const IconComponent: UserComponent<IconComponentProps> = ({
  icon = 'star',
  size = 32,
  color = '#000000'
}) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected
  }));

  const IconElement = getIconComponent(icon);

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      className={`inline-flex cursor-grab ${selected ? 'outline outline-2 outline-primary outline-dashed' : ''}`}
    >
      <IconElement size={size} color={color} />
    </div>
  );
};

const IconSettings = () => {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props
  }));

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm">Icon</Label>
        <Select 
          value={props.icon || 'star'} 
          onValueChange={(val) => setProp((props: IconComponentProps) => props.icon = val)}
        >
          <SelectTrigger className="rounded-none mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none max-h-60">
            {availableIcons.map((iconName) => (
              <SelectItem key={iconName} value={iconName}>
                {iconName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label className="text-sm">Size (px)</Label>
        <Input
          type="number"
          value={props.size || 32}
          onChange={(e) => setProp((props: IconComponentProps) => props.size = parseInt(e.target.value))}
          className="rounded-none mt-1"
        />
      </div>

      <div>
        <Label className="text-sm">Color</Label>
        <Input
          type="color"
          value={props.color || '#000000'}
          onChange={(e) => setProp((props: IconComponentProps) => props.color = e.target.value)}
          className="rounded-none mt-1 h-10"
        />
      </div>
    </div>
  );
};

IconComponent.craft = {
  props: {
    icon: 'star',
    size: 32,
    color: '#000000'
  },
  displayName: 'Icon',
  related: {
    settings: IconSettings
  }
};
