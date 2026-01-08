import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Trash2, X, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserNamesMap } from "@/components/results/hooks/useUserNamesMap";
import { useAnthropometricTestResults } from "@/components/results/hooks/useAnthropometricTestResults";
import { format } from "date-fns";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface AnthropometricHistoryTabProps {
  selectedUserId?: string;
  readOnly?: boolean;
  coachUserIds?: string[];
  useCoachTables?: boolean;
}

interface EditFormData {
  height: string;
  weight: string;
  muscle_mass_percentage: string;
  body_fat_percentage: string;
  visceral_fat_percentage: string;
  bone_density: string;
  chest_circumference: string;
  waist_circumference: string;
  hip_circumference: string;
  thigh_circumference: string;
  arm_circumference: string;
}

export const AnthropometricHistoryTab: React.FC<AnthropometricHistoryTabProps> = ({ selectedUserId, readOnly = false, coachUserIds, useCoachTables = false }) => {
  const { t } = useTranslation();
  const usersMap = useUserNamesMap();
  const { results, loading, refetch } = useAnthropometricTestResults(usersMap, selectedUserId, coachUserIds, useCoachTables);
  const [anthropometricData, setAnthropometricData] = useState<Record<string, any>>({});
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [userSearch, setUserSearch] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  
  // Edit state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    height: '',
    weight: '',
    muscle_mass_percentage: '',
    body_fat_percentage: '',
    visceral_fat_percentage: '',
    bone_density: '',
    chest_circumference: '',
    waist_circumference: '',
    hip_circumference: '',
    thigh_circumference: '',
    arm_circumference: '',
  });

  // Refetch when component mounts or key changes
  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (results.length > 0) {
      fetchAnthropometricData();
    }
  }, [results]);

  const fetchAnthropometricData = async () => {
    const data: Record<string, any> = {};
    const tableName = useCoachTables ? 'coach_anthropometric_test_data' : 'anthropometric_test_data';
    
    for (const result of results) {
      const { data: anthroData, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('test_session_id', result.id)
        .single();

      if (!error && anthroData) {
        data[result.id] = anthroData;
      }
    }
    
    setAnthropometricData(data);
  };

  const handleDeleteClick = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;

    const sessionsTable = useCoachTables ? 'coach_anthropometric_test_sessions' : 'anthropometric_test_sessions';
    const dataTable = useCoachTables ? 'coach_anthropometric_test_data' : 'anthropometric_test_data';

    try {
      // Delete anthropometric data first (foreign key)
      const { error: dataError } = await supabase
        .from(dataTable)
        .delete()
        .eq('test_session_id', sessionToDelete);

      if (dataError) throw dataError;

      // Delete session
      const { error: sessionError } = await supabase
        .from(sessionsTable)
        .delete()
        .eq('id', sessionToDelete);

      if (sessionError) throw sessionError;

      toast.success('Η καταγραφή διαγράφηκε επιτυχώς');
      setIsDeleteDialogOpen(false);
      setSessionToDelete(null);
      await refetch();
      fetchAnthropometricData();
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Σφάλμα κατά τη διαγραφή');
      setIsDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  const handleEditClick = (sessionId: string) => {
    const data = anthropometricData[sessionId];
    if (data) {
      setEditFormData({
        height: data.height?.toString() || '',
        weight: data.weight?.toString() || '',
        muscle_mass_percentage: data.muscle_mass_percentage?.toString() || '',
        body_fat_percentage: data.body_fat_percentage?.toString() || '',
        visceral_fat_percentage: data.visceral_fat_percentage?.toString() || '',
        bone_density: data.bone_density?.toString() || '',
        chest_circumference: data.chest_circumference?.toString() || '',
        waist_circumference: data.waist_circumference?.toString() || '',
        hip_circumference: data.hip_circumference?.toString() || '',
        thigh_circumference: data.thigh_circumference?.toString() || '',
        arm_circumference: data.arm_circumference?.toString() || '',
      });
      setEditingSessionId(sessionId);
      setIsEditDialogOpen(true);
    }
  };

  const handleEditSave = async () => {
    if (!editingSessionId) return;

    const dataTable = useCoachTables ? 'coach_anthropometric_test_data' : 'anthropometric_test_data';

    try {
      const updateData: Record<string, number | null> = {};

      Object.entries(editFormData).forEach(([key, value]) => {
        updateData[key] = value ? parseFloat(value) : null;
      });

      const { error } = await supabase
        .from(dataTable)
        .update(updateData)
        .eq('test_session_id', editingSessionId);

      if (error) throw error;

      toast.success('Η καταγραφή ενημερώθηκε επιτυχώς');
      setIsEditDialogOpen(false);
      setEditingSessionId(null);
      await fetchAnthropometricData();
    } catch (error) {
      console.error('Error updating record:', error);
      toast.error('Σφάλμα κατά την ενημέρωση');
    }
  };

  const handleClearFilters = () => {
    setSelectedYear("all");
    setUserSearch("");
  };

  // Get unique years
  const availableYears = useMemo(() => {
    const years = results.map(r => new Date(r.test_date).getFullYear());
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [results]);

  // Get filtered user suggestions
  const userSuggestions = useMemo(() => {
    if (!userSearch.trim()) return [];
    
    const searchLower = userSearch.toLowerCase();
    return Array.from(usersMap.entries())
      .map(([id, name]) => ({ id, name }))
      .filter(user => 
        user.name?.toLowerCase().includes(searchLower)
      )
      .slice(0, 10);
  }, [userSearch, usersMap]);

  // Filtered results
  const filteredResults = useMemo(() => {
    return results.filter(r => {
      // Filter by user search - only in admin dashboard
      if (!readOnly && userSearch.trim()) {
        const userName = usersMap.get(r.user_id);
        if (!userName) return false;
        
        const searchLower = userSearch.toLowerCase();
        const nameMatch = userName.toLowerCase().includes(searchLower);
        
        if (!nameMatch) return false;
      }
      
      if (selectedYear !== "all" && new Date(r.test_date).getFullYear().toString() !== selectedYear) return false;
      return true;
    });
  }, [results, selectedYear, userSearch, usersMap, readOnly]);

  if (loading) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">{t('history.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">{t('history.noRecords')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-start">
        {!readOnly && (
          <div className="relative w-[250px]">
            <Input
              type="text"
              placeholder="Αναζήτηση χρήστη..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="rounded-none pr-8"
            />
            {userSearch && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setUserSearch("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            
            {/* Suggestions dropdown */}
            {showSuggestions && userSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-none shadow-lg max-h-[300px] overflow-y-auto z-50">
                {userSuggestions.map((user) => (
                  <div
                    key={user.id}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setUserSearch(user.name);
                      setShowSuggestions(false);
                    }}
                  >
                    <div className="font-medium text-sm">{user.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[150px] rounded-none">
            <SelectValue placeholder="Όλα τα έτη" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="all">Όλα τα έτη</SelectItem>
            {availableYears.map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={handleClearFilters}
          className="rounded-none h-10"
        >
          <X className="w-4 h-4 mr-2" />
          Καθαρισμός
        </Button>
      </div>

      {filteredResults.map((result) => {
        const data = anthropometricData[result.id];
        
        return (
          <Card key={result.id} className="rounded-none">
            <CardHeader className="p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs sm:text-sm">{result.user_name}</CardTitle>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {format(new Date(result.test_date), 'dd/MM/yyyy')}
                  </p>
                </div>
                {!readOnly && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditClick(result.id)}
                      className="rounded-none h-6 w-6 sm:h-7 sm:w-7"
                    >
                      <Pencil className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(result.id)}
                      className="rounded-none text-destructive hover:text-destructive h-6 w-6 sm:h-7 sm:w-7"
                    >
                      <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            
            {data && (
              <CardContent className="p-2 sm:p-3 pt-0">
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5 sm:gap-2">
                  {data.height && (
                    <div className="space-y-0">
                      <p className="text-[9px] sm:text-xs text-muted-foreground">Ύψος</p>
                      <p className="text-[10px] sm:text-sm font-medium">{data.height} cm</p>
                    </div>
                  )}
                  {data.weight && (
                    <div className="space-y-0">
                      <p className="text-[9px] sm:text-xs text-muted-foreground">Βάρος</p>
                      <p className="text-[10px] sm:text-sm font-medium">{data.weight} kg</p>
                    </div>
                  )}
                  {data.muscle_mass_percentage && (
                    <div className="space-y-0">
                      <p className="text-[9px] sm:text-xs text-muted-foreground">Μυϊκή Μάζα</p>
                      <p className="text-[10px] sm:text-sm font-medium">{data.muscle_mass_percentage}%</p>
                    </div>
                  )}
                  {data.body_fat_percentage && (
                    <div className="space-y-0">
                      <p className="text-[9px] sm:text-xs text-muted-foreground">Λίπος</p>
                      <p className="text-[10px] sm:text-sm font-medium">{data.body_fat_percentage}%</p>
                    </div>
                  )}
                  {data.visceral_fat_percentage && (
                    <div className="space-y-0">
                      <p className="text-[9px] sm:text-xs text-muted-foreground">Σπλαχνικό Λίπος</p>
                      <p className="text-[10px] sm:text-sm font-medium">{data.visceral_fat_percentage}%</p>
                    </div>
                  )}
                  {data.bone_density && (
                    <div className="space-y-0">
                      <p className="text-[9px] sm:text-xs text-muted-foreground">Οστική Πυκνότητα</p>
                      <p className="text-[10px] sm:text-sm font-medium">{data.bone_density} kg</p>
                    </div>
                  )}
                  {data.chest_circumference && (
                    <div className="space-y-0">
                      <p className="text-[9px] sm:text-xs text-muted-foreground">Στήθος</p>
                      <p className="text-[10px] sm:text-sm font-medium">{data.chest_circumference} cm</p>
                    </div>
                  )}
                  {data.waist_circumference && (
                    <div className="space-y-0">
                      <p className="text-[9px] sm:text-xs text-muted-foreground">Μέση</p>
                      <p className="text-[10px] sm:text-sm font-medium">{data.waist_circumference} cm</p>
                    </div>
                  )}
                  {data.hip_circumference && (
                    <div className="space-y-0">
                      <p className="text-[9px] sm:text-xs text-muted-foreground">Ισχία</p>
                      <p className="text-[10px] sm:text-sm font-medium">{data.hip_circumference} cm</p>
                    </div>
                  )}
                  {data.thigh_circumference && (
                    <div className="space-y-0">
                      <p className="text-[9px] sm:text-xs text-muted-foreground">Μηρός</p>
                      <p className="text-[10px] sm:text-sm font-medium">{data.thigh_circumference} cm</p>
                    </div>
                  )}
                  {data.arm_circumference && (
                    <div className="space-y-0">
                      <p className="text-[9px] sm:text-xs text-muted-foreground">Βραχίονας</p>
                      <p className="text-[10px] sm:text-sm font-medium">{data.arm_circumference} cm</p>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSessionToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md rounded-none">
          <DialogHeader>
            <DialogTitle className="text-sm">Επεξεργασία Σωματομετρικών</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Ύψος (cm)</Label>
              <Input
                type="number"
                value={editFormData.height}
                onChange={(e) => setEditFormData(prev => ({ ...prev, height: e.target.value }))}
                className="rounded-none h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Βάρος (kg)</Label>
              <Input
                type="number"
                value={editFormData.weight}
                onChange={(e) => setEditFormData(prev => ({ ...prev, weight: e.target.value }))}
                className="rounded-none h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Μυϊκή Μάζα (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={editFormData.muscle_mass_percentage}
                onChange={(e) => setEditFormData(prev => ({ ...prev, muscle_mass_percentage: e.target.value }))}
                className="rounded-none h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Λίπος (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={editFormData.body_fat_percentage}
                onChange={(e) => setEditFormData(prev => ({ ...prev, body_fat_percentage: e.target.value }))}
                className="rounded-none h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Σπλαχνικό Λίπος (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={editFormData.visceral_fat_percentage}
                onChange={(e) => setEditFormData(prev => ({ ...prev, visceral_fat_percentage: e.target.value }))}
                className="rounded-none h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Οστική Πυκνότητα (kg)</Label>
              <Input
                type="number"
                step="0.1"
                value={editFormData.bone_density}
                onChange={(e) => setEditFormData(prev => ({ ...prev, bone_density: e.target.value }))}
                className="rounded-none h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Στήθος (cm)</Label>
              <Input
                type="number"
                step="0.1"
                value={editFormData.chest_circumference}
                onChange={(e) => setEditFormData(prev => ({ ...prev, chest_circumference: e.target.value }))}
                className="rounded-none h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Μέση (cm)</Label>
              <Input
                type="number"
                step="0.1"
                value={editFormData.waist_circumference}
                onChange={(e) => setEditFormData(prev => ({ ...prev, waist_circumference: e.target.value }))}
                className="rounded-none h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ισχία (cm)</Label>
              <Input
                type="number"
                step="0.1"
                value={editFormData.hip_circumference}
                onChange={(e) => setEditFormData(prev => ({ ...prev, hip_circumference: e.target.value }))}
                className="rounded-none h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Μηρός (cm)</Label>
              <Input
                type="number"
                step="0.1"
                value={editFormData.thigh_circumference}
                onChange={(e) => setEditFormData(prev => ({ ...prev, thigh_circumference: e.target.value }))}
                className="rounded-none h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Βραχίονας (cm)</Label>
              <Input
                type="number"
                step="0.1"
                value={editFormData.arm_circumference}
                onChange={(e) => setEditFormData(prev => ({ ...prev, arm_circumference: e.target.value }))}
                className="rounded-none h-8 text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="rounded-none h-8 text-xs"
            >
              Ακύρωση
            </Button>
            <Button
              onClick={handleEditSave}
              className="rounded-none h-8 text-xs"
              style={{ backgroundColor: '#00ffba', color: 'black' }}
            >
              Αποθήκευση
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
