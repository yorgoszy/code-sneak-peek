import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageIcon } from 'lucide-react';

interface ImageComponentProps {
  src: string;
  alt: string;
  width?: string;
  height?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  borderRadius?: number;
}

export const ImageComponent: UserComponent<ImageComponentProps> = ({
  src = '',
  alt = 'Image',
  width = '100%',
  height = 'auto',
  objectFit = 'cover',
  borderRadius = 0
}) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected
  }));

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      className={`cursor-grab ${selected ? 'outline outline-2 outline-primary outline-dashed' : ''}`}
      style={{ width, height: height === 'auto' ? 'auto' : height }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          style={{
            width: '100%',
            height: height === 'auto' ? 'auto' : '100%',
            objectFit,
            borderRadius: `${borderRadius}px`
          }}
        />
      ) : (
        <div 
          className="flex items-center justify-center bg-muted border-2 border-dashed border-border"
          style={{ 
            width: '100%', 
            height: height === 'auto' ? '200px' : '100%',
            borderRadius: `${borderRadius}px`
          }}
        >
          <div className="text-center text-muted-foreground">
            <ImageIcon className="w-12 h-12 mx-auto mb-2" />
            <span className="text-sm">Add image URL</span>
          </div>
        </div>
      )}
    </div>
  );
};

const ImageSettings = () => {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props
  }));

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm">Image URL</Label>
        <Input
          type="text"
          value={props.src || ''}
          onChange={(e) => setProp((props: ImageComponentProps) => props.src = e.target.value)}
          placeholder="https://..."
          className="rounded-none mt-1"
        />
      </div>
      
      <div>
        <Label className="text-sm">Alt Text</Label>
        <Input
          type="text"
          value={props.alt || ''}
          onChange={(e) => setProp((props: ImageComponentProps) => props.alt = e.target.value)}
          className="rounded-none mt-1"
        />
      </div>

      <div>
        <Label className="text-sm">Width</Label>
        <Input
          type="text"
          value={props.width || '100%'}
          onChange={(e) => setProp((props: ImageComponentProps) => props.width = e.target.value)}
          placeholder="100% or 300px"
          className="rounded-none mt-1"
        />
      </div>

      <div>
        <Label className="text-sm">Height</Label>
        <Input
          type="text"
          value={props.height || 'auto'}
          onChange={(e) => setProp((props: ImageComponentProps) => props.height = e.target.value)}
          placeholder="auto or 200px"
          className="rounded-none mt-1"
        />
      </div>

      <div>
        <Label className="text-sm">Object Fit</Label>
        <Select 
          value={props.objectFit || 'cover'} 
          onValueChange={(val) => setProp((props: ImageComponentProps) => props.objectFit = val as 'cover' | 'contain' | 'fill' | 'none')}
        >
          <SelectTrigger className="rounded-none mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="cover">Cover</SelectItem>
            <SelectItem value="contain">Contain</SelectItem>
            <SelectItem value="fill">Fill</SelectItem>
            <SelectItem value="none">None</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm">Border Radius (px)</Label>
        <Input
          type="number"
          value={props.borderRadius || 0}
          onChange={(e) => setProp((props: ImageComponentProps) => props.borderRadius = parseInt(e.target.value))}
          className="rounded-none mt-1"
        />
      </div>
    </div>
  );
};

ImageComponent.craft = {
  props: {
    src: '',
    alt: 'Image',
    width: '100%',
    height: 'auto',
    objectFit: 'cover',
    borderRadius: 0
  },
  displayName: 'Image',
  related: {
    settings: ImageSettings
  }
};
