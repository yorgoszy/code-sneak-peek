import React, { useState, useCallback } from 'react';
import { Editor, Frame, Element } from '@craftjs/core';
import { Sidebar as AdminSidebar } from '@/components/Sidebar';
import { LandingBuilderToolbox } from '@/components/landing-builder/LandingBuilderToolbox';
import { LandingBuilderSettings } from '@/components/landing-builder/LandingBuilderSettings';
import { LandingBuilderTopbar } from '@/components/landing-builder/LandingBuilderTopbar';
import { LandingBuilderCanvas } from '@/components/landing-builder/LandingBuilderCanvas';
import { 
  ContainerComponent, 
  TextComponent, 
  ImageComponent, 
  ButtonComponent,
  HeadingComponent,
  SectionComponent,
  GridComponent,
  DividerComponent,
  IconComponent,
  GradientBoxComponent
} from '@/components/landing-builder/components';
import { useLandingBuilderStore } from '@/hooks/useLandingBuilderStore';

const LandingBuilder: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const { saveLayout, loadLayout, layouts, currentLayoutId, setCurrentLayoutId } = useLandingBuilderStore();

  const resolver = {
    ContainerComponent,
    TextComponent,
    ImageComponent,
    ButtonComponent,
    HeadingComponent,
    SectionComponent,
    GridComponent,
    DividerComponent,
    IconComponent,
    GradientBoxComponent
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <div className="flex-1 flex flex-col">
        <Editor resolver={resolver}>
          <LandingBuilderTopbar 
            previewMode={previewMode}
            setPreviewMode={setPreviewMode}
            onSave={saveLayout}
            onLoad={loadLayout}
            layouts={layouts}
            currentLayoutId={currentLayoutId}
            setCurrentLayoutId={setCurrentLayoutId}
          />
          
          <div className="flex flex-1">
            {!previewMode && (
              <div className="w-64 border-r border-border bg-card overflow-y-auto">
                <LandingBuilderToolbox />
              </div>
            )}
            
            <div className="flex-1 overflow-auto p-4 bg-muted/30">
              <LandingBuilderCanvas previewMode={previewMode} />
            </div>
            
            {!previewMode && (
              <div className="w-72 border-l border-border bg-card overflow-y-auto">
                <LandingBuilderSettings />
              </div>
            )}
          </div>
        </Editor>
      </div>
    </div>
  );
};

export default LandingBuilder;
