import React, { useState, useEffect } from 'react';
import { Editor } from '@craftjs/core';
import { Sidebar as AdminSidebar } from '@/components/Sidebar';
import { LandingBuilderToolbox } from '@/components/landing-builder/LandingBuilderToolbox';
import { LandingBuilderSettings } from '@/components/landing-builder/LandingBuilderSettings';
import { LandingBuilderTopbar, type DeviceMode } from '@/components/landing-builder/LandingBuilderTopbar';
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
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const LandingBuilder: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const { saveLayout, loadLayout, layouts, currentLayoutId, setCurrentLayoutId } = useLandingBuilderStore();
  const isMobile = useIsMobile();
  const { signOut } = useAuth();

  useEffect(() => {
    const checkTablet = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth <= 1024);
    };
    checkTablet();
    window.addEventListener('resize', checkTablet);
    return () => window.removeEventListener('resize', checkTablet);
  }, []);

  const showSidebarButton = isMobile || isTablet;

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

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      {!showSidebarButton && (
        <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      )}

      {/* Mobile/Tablet Sidebar Overlay */}
      {showSidebarButton && showMobileSidebar && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMobileSidebar(false)}
          />
          <div className="relative w-64 h-full">
            <AdminSidebar isCollapsed={false} setIsCollapsed={setIsCollapsed} />
          </div>
        </div>
      )}
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile/Tablet Header */}
        {showSidebarButton && (
          <div className="sticky top-0 z-40 bg-background border-b border-border p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMobileSidebar(true)}
                  className="rounded-none"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-semibold">Landing Builder</h1>
              </div>
              <Button 
                variant="outline" 
                className="rounded-none"
                onClick={handleSignOut}
                size="sm"
              >
                <LogOut className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        <Editor resolver={resolver}>
          <LandingBuilderTopbar 
            previewMode={previewMode}
            setPreviewMode={setPreviewMode}
            deviceMode={deviceMode}
            setDeviceMode={setDeviceMode}
            onSave={saveLayout}
            onLoad={loadLayout}
            layouts={layouts}
            currentLayoutId={currentLayoutId}
            setCurrentLayoutId={setCurrentLayoutId}
          />
          
          <div className="flex flex-1">
            {!previewMode && (
              <div className="w-64 border-r border-border bg-card overflow-y-auto hidden md:block">
                <LandingBuilderToolbox />
              </div>
            )}
            
            <div className="flex-1 overflow-auto p-4 bg-muted/30">
              <LandingBuilderCanvas previewMode={previewMode} deviceMode={deviceMode} />
            </div>
            
            {!previewMode && (
              <div className="w-72 border-l border-border bg-card overflow-y-auto hidden lg:block">
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
