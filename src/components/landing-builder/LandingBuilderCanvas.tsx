import React from 'react';
import { Frame, Element } from '@craftjs/core';
import { ContainerComponent } from './components';

interface LandingBuilderCanvasProps {
  previewMode: boolean;
}

export const LandingBuilderCanvas: React.FC<LandingBuilderCanvasProps> = ({ previewMode }) => {
  return (
    <div 
      className={`
        min-h-[800px] bg-white shadow-lg mx-auto
        ${previewMode ? 'max-w-full' : 'max-w-5xl border border-dashed border-border'}
      `}
    >
      <Frame>
        <Element 
          is={ContainerComponent} 
          canvas
          custom={{ displayName: 'Root Container' }}
        />
      </Frame>
    </div>
  );
};
