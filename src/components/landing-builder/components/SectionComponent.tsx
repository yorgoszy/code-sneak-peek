import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface SectionComponentProps {
  background?: string;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  children?: React.ReactNode;
  maxWidth?: string;
  centered?: boolean;
}

export const SectionComponent: UserComponent<SectionComponentProps> = ({
  background = '#ffffff',
  paddingTop = 60,
  paddingBottom = 60,
  paddingLeft = 20,
  paddingRight = 20,
  children,
  maxWidth = '1200px',
  centered = true
}) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected
  }));

  return (
    <section
      ref={(ref) => ref && connect(drag(ref))}
      style={{
        background,
        paddingTop: `${paddingTop}px`,
        paddingBottom: `${paddingBottom}px`,
        paddingLeft: `${paddingLeft}px`,
        paddingRight: `${paddingRight}px`,
        width: '100%'
      }}
      className={`${selected ? 'outline outline-2 outline-primary outline-dashed' : ''}`}
    >
      <div
        style={{
          maxWidth,
          margin: centered ? '0 auto' : '0',
          width: '100%'
        }}
      >
        {children}
      </div>
    </section>
  );
};

const SectionSettings = () => {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props
  }));

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm">Background</Label>
        <Input
          type="text"
          value={props.background || '#ffffff'}
          onChange={(e) => setProp((props: SectionComponentProps) => props.background = e.target.value)}
          placeholder="#ffffff or gradient"
          className="rounded-none mt-1"
        />
      </div>
      
      <div>
        <Label className="text-sm">Padding Top (px)</Label>
        <Input
          type="number"
          value={props.paddingTop || 60}
          onChange={(e) => setProp((props: SectionComponentProps) => props.paddingTop = parseInt(e.target.value))}
          className="rounded-none mt-1"
        />
      </div>

      <div>
        <Label className="text-sm">Padding Bottom (px)</Label>
        <Input
          type="number"
          value={props.paddingBottom || 60}
          onChange={(e) => setProp((props: SectionComponentProps) => props.paddingBottom = parseInt(e.target.value))}
          className="rounded-none mt-1"
        />
      </div>

      <div>
        <Label className="text-sm">Padding Left (px)</Label>
        <Input
          type="number"
          value={props.paddingLeft || 20}
          onChange={(e) => setProp((props: SectionComponentProps) => props.paddingLeft = parseInt(e.target.value))}
          className="rounded-none mt-1"
        />
      </div>

      <div>
        <Label className="text-sm">Padding Right (px)</Label>
        <Input
          type="number"
          value={props.paddingRight || 20}
          onChange={(e) => setProp((props: SectionComponentProps) => props.paddingRight = parseInt(e.target.value))}
          className="rounded-none mt-1"
        />
      </div>

      <div>
        <Label className="text-sm">Max Width</Label>
        <Input
          type="text"
          value={props.maxWidth || '1200px'}
          onChange={(e) => setProp((props: SectionComponentProps) => props.maxWidth = e.target.value)}
          placeholder="1200px or 100%"
          className="rounded-none mt-1"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="centered"
          checked={props.centered !== false}
          onChange={(e) => setProp((props: SectionComponentProps) => props.centered = e.target.checked)}
        />
        <Label htmlFor="centered" className="text-sm">Center Content</Label>
      </div>
    </div>
  );
};

SectionComponent.craft = {
  props: {
    background: '#ffffff',
    paddingTop: 60,
    paddingBottom: 60,
    paddingLeft: 20,
    paddingRight: 20,
    maxWidth: '1200px',
    centered: true
  },
  displayName: 'Section',
  related: {
    settings: SectionSettings
  }
};
