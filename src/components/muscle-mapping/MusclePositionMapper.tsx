import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { Save, Target, Check, X, Loader2, AlertTriangle, Search, Link2, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface Muscle {
  id: string;
  name: string;
  muscle_group: string | null;
  mesh_name: string | null;
}

// Lazy load the 3D canvas
const Muscle3DCanvas = React.lazy(() => import('./Muscle3DCanvas'));

// Loading fallback
function Canvas3DFallback() {
  return (
    <div className="w-full h-[300px] sm:h-[400px] lg:h-[500px] flex items-center justify-center bg-black/95">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00ffba] mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Φόρτωση 3D Model...</p>
      </div>
    </div>
  );
}

// Error fallback
function Canvas3DError() {
  return (
    <div className="w-full h-[300px] sm:h-[400px] lg:h-[500px] flex items-center justify-center bg-black/95">
      <div className="text-center">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Σφάλμα φόρτωσης 3D</p>
        <p className="text-xs text-muted-foreground mt-1">Δοκίμασε να ανανεώσεις τη σελίδα</p>
      </div>
    </div>
  );
}

// Error boundary
class Canvas3DErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('3D Canvas Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <Canvas3DError />;
    }
    return this.props.children;
  }
}

export const MusclePositionMapper: React.FC = () => {
  const [muscles, setMuscles] = useState<Muscle[]>([]);
  const [selectedMuscleId, setSelectedMuscleId] = useState<string>('');
  const [isSelecting, setIsSelecting] = useState(false);
  const [pendingMeshName, setPendingMeshName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [foundCount, setFoundCount] = useState(0);
  const [searchMatches, setSearchMatches] = useState<string[]>([]);
  const [selectedSearchMesh, setSelectedSearchMesh] = useState<string | null>(null);
  const [muscleSearch, setMuscleSearch] = useState('');
  const [muscleDropdownOpen, setMuscleDropdownOpen] = useState(false);
  const [availableMeshNames, setAvailableMeshNames] = useState<string[]>([]);
  const [meshSuggestionsOpen, setMeshSuggestionsOpen] = useState(false);

  // Handle search results from 3D canvas
  const handleSearchResults = (count: number, matches: string[]) => {
    setFoundCount(count);
    setSearchMatches(matches);
  };

  useEffect(() => {
    fetchMuscles();
  }, []);

  const fetchMuscles = async () => {
    try {
      const { data, error } = await supabase
        .from('muscles')
        .select('*')
        .order('name');
      
      if (error) throw error;
      // Cast to our interface since mesh_name is a new column
      const musclesData = (data || []).map(m => ({
        id: m.id,
        name: m.name,
        muscle_group: m.muscle_group,
        mesh_name: (m as any).mesh_name || null
      })) as Muscle[];
      setMuscles(musclesData);
    } catch (error) {
      console.error('Error fetching muscles:', error);
      toast.error('Σφάλμα φόρτωσης μυών');
    } finally {
      setLoading(false);
    }
  };

  const handleMeshClick = (meshName: string) => {
    if (!selectedMuscleId) {
      toast.error('Επέλεξε πρώτα έναν μυ από τη λίστα');
      return;
    }
    if (!isSelecting) {
      return;
    }
    
    console.log('🔗 Mesh clicked for mapping:', meshName);
    setPendingMeshName(meshName);
    setIsSelecting(false);
  };

  const handleSaveMapping = async () => {
    if (!selectedMuscleId || !pendingMeshName) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('muscles')
        .update({ mesh_name: pendingMeshName } as any)
        .eq('id', selectedMuscleId);
      
      if (error) throw error;
      
      setMuscles(prev => prev.map(m => 
        m.id === selectedMuscleId 
          ? { ...m, mesh_name: pendingMeshName }
          : m
      ));
      
      toast.success('Η αντιστοίχιση αποθηκεύτηκε!');
      setPendingMeshName(null);
      setSelectedMuscleId('');
    } catch (error) {
      console.error('Error saving mapping:', error);
      toast.error('Σφάλμα αποθήκευσης');
    } finally {
      setSaving(false);
    }
  };

  const handleClearMapping = async (muscleId: string) => {
    try {
      const { error } = await supabase
        .from('muscles')
        .update({ mesh_name: null } as any)
        .eq('id', muscleId);
      
      if (error) throw error;
      
      setMuscles(prev => prev.map(m => 
        m.id === muscleId 
          ? { ...m, mesh_name: null }
          : m
      ));
      
      toast.success('Η αντιστοίχιση διαγράφηκε');
    } catch (error) {
      console.error('Error clearing mapping:', error);
      toast.error('Σφάλμα διαγραφής');
    }
  };

  const selectedMuscle = muscles.find(m => m.id === selectedMuscleId);
  const mappedCount = muscles.filter(m => m.mesh_name !== null).length;
  const mappedMeshNames = muscles.filter(m => m.mesh_name).map(m => m.mesh_name!);

  // Filtered muscles for the dropdown
  const filteredMuscles = useMemo(() => {
    if (!muscleSearch.trim()) return muscles;
    const search = muscleSearch.toLowerCase();
    return muscles.filter(m => m.name.toLowerCase().includes(search));
  }, [muscles, muscleSearch]);

  // Filtered mesh suggestions for autocomplete
  const filteredMeshSuggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    return availableMeshNames
      .filter(name => name.toLowerCase().includes(query))
      .slice(0, 10); // Limit to 10 suggestions
  }, [searchQuery, availableMeshNames]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Φόρτωση...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* Controls Panel */}
      <Card className="rounded-none order-1 lg:order-2">
        <CardHeader className="p-3 sm:p-4 pb-2">
          <CardTitle className="text-base sm:text-lg flex items-center justify-between">
            <span>Αντιστοίχιση Μυών</span>
            <Badge variant="outline" className="rounded-none text-xs lg:hidden">
              {mappedCount}/{muscles.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0 space-y-3 sm:space-y-4">
          {/* Search for mesh names with autocomplete */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
              <Search className="w-3 h-3" />
              Αναζήτηση Mesh (Λατινικά)
            </label>
            <div className="relative">
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchActive(false);
                    setSelectedSearchMesh(null);
                    setMeshSuggestionsOpen(e.target.value.length >= 2);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (searchQuery.trim()) {
                        setSearchActive(true);
                        setMeshSuggestionsOpen(false);
                        toast.info(`Αναζήτηση: "${searchQuery}"`);
                      }
                    }
                    if (e.key === 'Escape') {
                      setMeshSuggestionsOpen(false);
                    }
                  }}
                  onFocus={() => {
                    if (searchQuery.length >= 2) setMeshSuggestionsOpen(true);
                  }}
                  onBlur={() => {
                    // Delay to allow click on suggestions
                    setTimeout(() => setMeshSuggestionsOpen(false), 200);
                  }}
                  placeholder="π.χ. Biceps, Trapezius..."
                  className="rounded-none text-sm flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (searchQuery.trim()) {
                      setSearchActive(true);
                      setMeshSuggestionsOpen(false);
                      toast.info(`Αναζήτηση: "${searchQuery}"`);
                    }
                  }}
                  className="rounded-none px-3"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Autocomplete suggestions */}
              {meshSuggestionsOpen && filteredMeshSuggestions.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-12 mt-1 bg-background border shadow-lg max-h-[200px] overflow-y-auto">
                  {filteredMeshSuggestions.map((meshName, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setSearchQuery(meshName);
                        setSearchActive(true);
                        setMeshSuggestionsOpen(false);
                      }}
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-muted flex items-center justify-between"
                    >
                      <span className="font-mono text-xs">{meshName}</span>
                      {mappedMeshNames.some(m => m.includes(meshName)) && (
                        <Check className="w-3 h-3 text-[#00ffba]" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {searchActive && foundCount > 0 && !selectedSearchMesh && (
              <div className="space-y-1">
                <p className="text-[10px] text-[#00ffba] font-medium">
                  ✓ Βρέθηκαν {foundCount} meshes - Επέλεξε ένα:
                </p>
                <div className="max-h-[120px] overflow-y-auto border bg-black/50">
                  {searchMatches.map((meshName, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setSelectedSearchMesh(meshName);
                        toast.success(`Επιλέχθηκε: ${meshName}`);
                      }}
                      className="px-2 py-1.5 text-xs font-mono cursor-pointer hover:bg-[#00ffba]/20 border-b border-white/10 last:border-0"
                    >
                      {meshName}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {searchActive && selectedSearchMesh && (
              <div className="space-y-1">
                <p className="text-[10px] text-[#00ff00] font-medium">
                  ✓ Επιλεγμένο mesh:
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#00ff00] flex-1 truncate">{selectedSearchMesh}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 rounded-none"
                    onClick={() => setSelectedSearchMesh(null)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
            {searchActive && foundCount === 0 && (
              <p className="text-[10px] text-amber-500 font-medium">
                ✗ Δεν βρέθηκε mesh με "{searchQuery}"
              </p>
            )}
            {!searchActive && (
              <p className="text-[10px] text-muted-foreground">
                Γράψε 2+ χαρακτήρες για προτάσεις
              </p>
            )}
          </div>

          {/* Muscle selector with search */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm text-muted-foreground">Επιλογή Μυός (Ελληνικά)</label>
            <Popover open={muscleDropdownOpen} onOpenChange={setMuscleDropdownOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full rounded-none text-sm justify-between font-normal"
                >
                  <span className={selectedMuscle ? '' : 'text-muted-foreground'}>
                    {selectedMuscle ? selectedMuscle.name : 'Επέλεξε μυ...'}
                  </span>
                  <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0 rounded-none" align="start">
                <div className="p-2 border-b">
                  <Input
                    placeholder="Αναζήτηση μυός..."
                    value={muscleSearch}
                    onChange={(e) => setMuscleSearch(e.target.value)}
                    className="rounded-none text-sm h-8"
                    autoFocus
                  />
                </div>
                <div className="max-h-[250px] overflow-y-auto">
                  {filteredMuscles.length === 0 ? (
                    <div className="p-3 text-center text-sm text-muted-foreground">
                      Δεν βρέθηκαν μύες
                    </div>
                  ) : (
                    filteredMuscles.map(muscle => (
                      <div
                        key={muscle.id}
                        onClick={() => {
                          setSelectedMuscleId(muscle.id);
                          setMuscleDropdownOpen(false);
                          setMuscleSearch('');
                        }}
                        className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-muted ${
                          muscle.id === selectedMuscleId ? 'bg-muted' : ''
                        }`}
                      >
                        <span className="truncate">{muscle.name}</span>
                        {muscle.mesh_name && (
                          <Check className="w-3 h-3 text-[#00ffba] flex-shrink-0" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <Button
              onClick={() => setIsSelecting(true)}
              disabled={!selectedMuscleId || isSelecting}
              className="w-full rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black text-sm"
            >
              <Target className="w-4 h-4 mr-2" />
              {isSelecting ? 'Κάνε click στον μυ...' : 'Αντιστοίχιση με Mesh'}
            </Button>

            {isSelecting && (
              <Button
                onClick={() => setIsSelecting(false)}
                variant="outline"
                className="w-full rounded-none text-sm"
              >
                <X className="w-4 h-4 mr-2" />
                Ακύρωση
              </Button>
            )}
          </div>

          {/* Pending mapping */}
          {pendingMeshName && selectedMuscle && (
            <div className="space-y-2 p-2 sm:p-3 bg-muted/50 border">
              <div className="text-xs sm:text-sm font-medium truncate">{selectedMuscle.name}</div>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                <Link2 className="w-3 h-3" />
                <span className="font-mono">{pendingMeshName}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveMapping}
                  disabled={saving}
                  size="sm"
                  className="flex-1 rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black text-xs sm:text-sm"
                >
                  <Save className="w-3 h-3 mr-1" />
                  Αποθήκευση
                </Button>
                <Button
                  onClick={() => setPendingMeshName(null)}
                  variant="outline"
                  size="sm"
                  className="rounded-none"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Mapped muscles list */}
          <div className="space-y-2">
            <div className="text-xs sm:text-sm font-medium">Αντιστοιχισμένοι ({mappedCount})</div>
            <div className="max-h-[150px] sm:max-h-[200px] overflow-y-auto space-y-1">
              {muscles.filter(m => m.mesh_name !== null).map(muscle => (
                <div 
                  key={muscle.id} 
                  className="flex items-center justify-between p-1.5 sm:p-2 bg-muted/30 text-[10px] sm:text-xs"
                >
                  <div className="flex-1 mr-2 min-w-0">
                    <div className="truncate">{muscle.name}</div>
                    <div className="truncate text-muted-foreground font-mono">{muscle.mesh_name}</div>
                  </div>
                  <Button
                    onClick={() => handleClearMapping(muscle.id)}
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 sm:h-6 sm:w-6 p-0 rounded-none hover:bg-destructive/20 flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3D Model */}
      <Card className="rounded-none lg:col-span-2 order-2 lg:order-1">
        <CardHeader className="p-3 sm:p-4 pb-2">
          <CardTitle className="text-base sm:text-lg flex items-center justify-between">
            <span>3D Body Model</span>
            <Badge variant="outline" className="rounded-none text-xs hidden lg:inline-flex">
              {mappedCount}/{muscles.length} μύες
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <Canvas3DErrorBoundary>
            <Suspense fallback={<Canvas3DFallback />}>
              <Muscle3DCanvas
                isSelecting={isSelecting}
                selectedMuscleName={selectedMuscle?.name}
                onMeshClick={handleMeshClick}
                searchQuery={searchActive ? searchQuery : ''}
                mappedMeshNames={mappedMeshNames}
                onSearchResults={handleSearchResults}
                onMeshNamesLoaded={setAvailableMeshNames}
                selectedSearchMesh={selectedSearchMesh}
              />
            </Suspense>
          </Canvas3DErrorBoundary>
        </CardContent>
      </Card>
    </div>
  );
};