import React from 'react';
import { Frame, Element } from '@craftjs/core';
import { ContainerComponent } from './components';
import { TextComponent } from './components';
import type { DeviceMode } from './LandingBuilderTopbar';

interface LandingBuilderCanvasProps {
  previewMode: boolean;
  deviceMode: DeviceMode;
}

const deviceWidths: Record<DeviceMode, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px'
};

export const LandingBuilderCanvas: React.FC<LandingBuilderCanvasProps> = ({ previewMode, deviceMode }) => {
  const width = previewMode ? '100%' : deviceWidths[deviceMode];
  
  return (
    <div 
      className={`
        min-h-[800px] bg-white shadow-lg mx-auto transition-all duration-300
        ${previewMode ? '' : 'border border-dashed border-border'}
      `}
      style={{ 
        maxWidth: width,
        width: deviceMode === 'desktop' ? '100%' : width
      }}
    >
      <Frame>
        <Element 
          is={ContainerComponent} 
          canvas
          background="transparent"
          padding={20}
          minHeight={600}
          custom={{ displayName: 'Root Container' }}
        >
          <Element is={TextComponent} text="Σύρε components από το Toolbox για να ξεκινήσεις!" fontSize={16} textAlign="center" color="#666" />
        </Element>
      </Frame>
    </div>
  );
};
