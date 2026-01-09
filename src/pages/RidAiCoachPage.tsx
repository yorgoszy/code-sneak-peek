import React, { useState } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { RidAiCoach } from "@/components/rid-ai/RidAiCoach";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Menu, Camera } from "lucide-react";
import { AICoachDialog } from "@/components/ai-coach";

export default function RidAiCoachPage() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showAICoach, setShowAICoach] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobile && showMobileSidebar && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMobileSidebar(false)}
          />
          <div className="relative w-64 h-full">
            <Sidebar 
              isCollapsed={false} 
              setIsCollapsed={setIsCollapsed}
            />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0">
        {/* Mobile Header */}
        {isMobile && (
          <div className="bg-white border-b px-4 py-3 flex items-center justify-between md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileSidebar(true)}
              className="p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">RID AI Coach</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAICoach(true)}
              className="p-2"
            >
              <Camera className="h-5 w-5 text-[#00ffba]" />
            </Button>
          </div>
        )}

        <div className="p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            {/* Desktop AI Coach button */}
            {!isMobile && (
              <div className="flex justify-end mb-4">
                <Button
                  onClick={() => setShowAICoach(true)}
                  className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  AI Coach με Κάμερα
                </Button>
              </div>
            )}
            <RidAiCoach />
          </div>
        </div>
      </div>

      <AICoachDialog isOpen={showAICoach} onClose={() => setShowAICoach(false)} />
    </div>
  );
}
