import React from 'react';
import { useNode, Element, UserComponent } from '@craftjs/core';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ContainerComponent } from './ContainerComponent';

interface GridComponentProps {
  columns?: number;
  gap?: number;
  children?: React.ReactNode;
}

export const GridComponent: UserComponent<GridComponentProps> = ({
  columns = 2,
  gap = 16,
  children
}) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected
  }));

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
        width: '100%'
      }}
      className={`${selected ? 'outline outline-2 outline-primary outline-dashed' : ''}`}
    >
      {children || (
        <>
          {Array.from({ length: columns }).map((_, i) => (
            <Element key={i} is={ContainerComponent} canvas id={`grid-col-${i}`}>
              <div className="p-4 bg-muted/50 min-h-[100px] flex items-center justify-center text-muted-foreground">
                Column {i + 1}
              </div>
            </Element>
          ))}
        </>
      )}
    </div>
  );
};

const GridSettings = () => {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props
  }));

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm">Columns</Label>
        <Input
          type="number"
          min={1}
          max={6}
          value={props.columns || 2}
          onChange={(e) => setProp((props: GridComponentProps) => props.columns = parseInt(e.target.value))}
          className="rounded-none mt-1"
        />
      </div>
      
      <div>
        <Label className="text-sm">Gap (px)</Label>
        <Input
          type="number"
          value={props.gap || 16}
          onChange={(e) => setProp((props: GridComponentProps) => props.gap = parseInt(e.target.value))}
          className="rounded-none mt-1"
        />
      </div>
    </div>
  );
};

GridComponent.craft = {
  props: {
    columns: 2,
    gap: 16
  },
  displayName: 'Grid',
  related: {
    settings: GridSettings
  }
};
