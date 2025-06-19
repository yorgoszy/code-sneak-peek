
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";
import { AIChatDialog } from "@/components/ai-chat/AIChatDialog";

interface TestsHeaderProps {
  selectedAthleteId?: string;
  selectedAthleteName?: string;
}

export const TestsHeader: React.FC<TestsHeaderProps> = ({ 
  selectedAthleteId, 
  selectedAthleteName 
}) => {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  return (
    <>
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Τεστ</h1>
            <p className="text-sm text-gray-600">
              Διαχείριση τεστ αθλητών
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setIsAIChatOpen(true)}
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none flex items-center gap-2"
            >
              <Bot className="w-4 h-4" />
              AI Βοηθός
            </Button>
          </div>
        </div>
      </nav>

      <AIChatDialog
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        athleteId={selectedAthleteId}
        athleteName={selectedAthleteName}
      />
    </>
  );
};
