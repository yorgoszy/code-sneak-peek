import React from 'react';
import { Frame, Element } from '@craftjs/core';
import { ContainerComponent } from './components';
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
          custom={{ displayName: 'Root Container' }}
        />
      </Frame>
    </div>
  );
};
