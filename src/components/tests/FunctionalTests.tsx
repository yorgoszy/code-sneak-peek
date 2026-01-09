import { useState, useEffect } from "react";
import { PostureTest } from "./functional/PostureTest";
import { SquatTest } from "./functional/SquatTest";
import { SingleLegSquatTest } from "./functional/SingleLegSquatTest";
import { FMSTest } from "./functional/FMSTest";
import { MuscleExerciseLinkDialog } from "./functional/MuscleExerciseLinkDialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, ArrowUp, MoveHorizontal, X, Link } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FunctionalData {
  fmsScores: Record<string, number>;
  selectedPosture: string[];
  selectedSquatIssues: string[];
  selectedSingleLegIssues: string[];
}

interface FunctionalTestsProps {
  selectedAthleteId: string;
  selectedDate: string;
  hideSubmitButton?: boolean;
  formData?: FunctionalData;
  onDataChange?: (data: FunctionalData) => void;
  /**
   * Final muscles after the "Επόμενο" step and after the user removes the ones they don't want.
   * These are the muscles we should save.
   */
  onMusclesChange?: (muscles: { strengthen: string[]; stretch: string[] }) => void;
}

interface MuscleMapping {
  issue_name: string;
  action_type: string;
  muscle_name: string;
}

export const FunctionalTests = ({ 
  selectedAthleteId, 
  selectedDate, 
  hideSubmitButton = false,
  formData,
  onDataChange,
  onMusclesChange,
}: FunctionalTestsProps) => {
  const [showResults, setShowResults] = useState(false);
  const [muscleMappings, setMuscleMappings] = useState<MuscleMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [removedMuscles, setRemovedMuscles] = useState<{ strengthen: string[]; stretch: string[] }>({
    strengthen: [],
    stretch: [],
  });
  
  // Dialog state for muscle-exercise linking
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedMuscleForLink, setSelectedMuscleForLink] = useState<{
    muscle: string;
    issue: string;
    type: 'stretching' | 'strengthening';
  } | null>(null);

  useEffect(() => {
    // When switching athlete/date, reset results state.
    setShowResults(false);
    setMuscleMappings([]);
    setRemovedMuscles({ strengthen: [], stretch: [] });
    onMusclesChange?.({ strengthen: [], stretch: [] });
  }, [selectedAthleteId, selectedDate]);

  const handleRemoveMuscle = (muscle: string, type: 'strengthen' | 'stretch') => {
    setRemovedMuscles(prev => ({
      ...prev,
      [type]: [...prev[type], muscle]
    }));
  };

  const handleFmsScoreChange = (scores: Record<string, number>) => {
    if (onDataChange && formData) {
      onDataChange({ ...formData, fmsScores: scores });
    }
  };

  const handlePostureChange = (posture: string[]) => {
    if (onDataChange && formData) {
      onDataChange({ ...formData, selectedPosture: posture });
    }
  };

  const handleSquatChange = (issues: string[]) => {
    if (onDataChange && formData) {
      onDataChange({ ...formData, selectedSquatIssues: issues });
    }
  };

  const handleSingleLegChange = (issues: string[]) => {
    if (onDataChange && formData) {
      onDataChange({ ...formData, selectedSingleLegIssues: issues });
    }
  };

  const getAllSelectedIssues = () => {
    const allIssues: string[] = [];
    if (formData?.selectedPosture) {
      allIssues.push(...formData.selectedPosture);
    }
    if (formData?.selectedSquatIssues) {
      allIssues.push(...formData.selectedSquatIssues);
    }
    if (formData?.selectedSingleLegIssues) {
      allIssues.push(...formData.selectedSingleLegIssues);
    }
    return allIssues;
  };

  const fetchMuscleResults = async () => {
    const selectedIssues = getAllSelectedIssues();
    if (selectedIssues.length === 0) {
      setMuscleMappings([]);
      setShowResults(true);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('functional_issue_muscle_mappings')
        .select(`
          issue_name,
          action_type,
          muscles!inner(name)
        `)
        .in('issue_name', selectedIssues);

      if (error) throw error;

      const mappings: MuscleMapping[] = (data || []).map((item: any) => ({
        issue_name: item.issue_name,
        action_type: item.action_type,
        muscle_name: item.muscles?.name || ''
      }));

      setMuscleMappings(mappings);
    } catch (error) {
      console.error('Error fetching muscle mappings:', error);
    } finally {
      setLoading(false);
      setShowResults(true);
    }
  };

  const handleNext = () => {
    fetchMuscleResults();
  };

  const handleBack = () => {
    setShowResults(false);
    // keep removedMuscles so if they go Next again it keeps their choices? -> reset for clarity
    setRemovedMuscles({ strengthen: [], stretch: [] });
    onMusclesChange?.({ strengthen: [], stretch: [] });
  };

  // Group muscles by action type (excluding removed ones) - using Set to remove duplicates
  const strengthenMuscles = [...new Set(
    muscleMappings
      .filter(m => m.action_type === 'strengthen')
      .map(m => m.muscle_name?.trim())
      .filter(Boolean)
  )].filter(m => !removedMuscles.strengthen.includes(m));

  const stretchMuscles = [...new Set(
    muscleMappings
      .filter(m => m.action_type === 'stretch')
      .map(m => m.muscle_name?.trim())
      .filter(Boolean)
  )].filter(m => !removedMuscles.stretch.includes(m));

  const handleMuscleClick = (muscle: string, type: 'strengthening' | 'stretching') => {
    // Get the first issue that caused this muscle to be recommended
    const mapping = muscleMappings.find(
      m => m.muscle_name?.trim() === muscle && 
      ((type === 'strengthening' && m.action_type === 'strengthen') ||
       (type === 'stretching' && m.action_type === 'stretch'))
    );
    
    if (mapping) {
      setSelectedMuscleForLink({
        muscle,
        issue: mapping.issue_name,
        type: type === 'strengthening' ? 'strengthening' : 'stretching',
      });
      setLinkDialogOpen(true);
    }
  };

  useEffect(() => {
    if (!showResults) return;
    onMusclesChange?.({ strengthen: strengthenMuscles, stretch: stretchMuscles });
  }, [showResults, strengthenMuscles, stretchMuscles, onMusclesChange]);

  if (showResults) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Αποτελέσματα Αξιολόγησης</h3>
          <Button 
            variant="outline" 
            onClick={handleBack}
            className="rounded-none"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Πίσω
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Φόρτωση...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ενδυνάμωση */}
            <div className="border p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-green-700 mb-4">
                <ArrowUp className="w-4 h-4" />
                Ενδυνάμωση
              </div>
              {strengthenMuscles.length > 0 ? (
                <ul className="space-y-1">
                  {strengthenMuscles.map((muscle) => (
                    <li key={muscle} className="text-sm bg-green-50 px-3 py-2 border border-green-200 flex items-center justify-between group">
                      <button 
                        onClick={() => handleMuscleClick(muscle, 'strengthening')}
                        className="flex items-center gap-2 text-left hover:text-green-700 cursor-pointer"
                      >
                        <Link className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span>{muscle}</span>
                      </button>
                      <button 
                        onClick={() => handleRemoveMuscle(muscle, 'strengthen')}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Δεν υπάρχουν μύες για ενδυνάμωση</p>
              )}
            </div>

            {/* Διάταση */}
            <div className="border p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 mb-4">
                <MoveHorizontal className="w-4 h-4" />
                Διάταση
              </div>
              {stretchMuscles.length > 0 ? (
                <ul className="space-y-1">
                  {stretchMuscles.map((muscle) => (
                    <li key={muscle} className="text-sm bg-blue-50 px-3 py-2 border border-blue-200 flex items-center justify-between group">
                      <button 
                        onClick={() => handleMuscleClick(muscle, 'stretching')}
                        className="flex items-center gap-2 text-left hover:text-blue-700 cursor-pointer"
                      >
                        <Link className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span>{muscle}</span>
                      </button>
                      <button 
                        onClick={() => handleRemoveMuscle(muscle, 'stretch')}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Δεν υπάρχουν μύες για διάταση</p>
              )}
            </div>
          </div>
        )}

        {/* Επιλεγμένα Issues */}
        <div className="border p-4 mt-4">
          <h4 className="font-semibold text-sm mb-2">Επιλεγμένα Ζητήματα:</h4>
          <div className="flex flex-wrap gap-2">
            {getAllSelectedIssues().map((issue) => (
              <span key={issue} className="text-xs bg-gray-100 px-2 py-1 border">
                {issue}
              </span>
            ))}
          </div>
        </div>

        {/* Dialog for muscle-exercise linking */}
        {selectedMuscleForLink && (
          <MuscleExerciseLinkDialog
            open={linkDialogOpen}
            onOpenChange={setLinkDialogOpen}
            muscleName={selectedMuscleForLink.muscle}
            issueName={selectedMuscleForLink.issue}
            exerciseType={selectedMuscleForLink.type}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Στάση Σώματος + Μονοποδικά */}
        <div className="space-y-4">
          <PostureTest 
            selectedPosture={formData?.selectedPosture || []}
            onPostureChange={handlePostureChange}
          />
          <SingleLegSquatTest 
            selectedSingleLegIssues={formData?.selectedSingleLegIssues || []}
            onSingleLegChange={handleSingleLegChange}
          />
        </div>

        {/* Καθήματα */}
        <SquatTest 
          selectedSquatIssues={formData?.selectedSquatIssues || []}
          onSquatChange={handleSquatChange}
        />

        {/* FMS */}
        <div className="lg:col-span-2">
          <FMSTest 
            fmsScores={formData?.fmsScores || {}}
            onFmsScoreChange={handleFmsScoreChange}
          />
        </div>
      </div>

      {/* Κουμπί Επόμενο */}
      <div className="flex justify-end">
        <Button 
          onClick={handleNext}
          className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
        >
          Επόμενο
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
