
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { useCentralizedTestSession } from "./hooks/useCentralizedTestSession";

export const useTestsState = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [activeTab, setActiveTab] = useState<string>("anthropometric");
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // State για κάθε τύπο τεστ
  const [anthropometricData, setAnthropometricData] = useState<any>({});
  const [functionalData, setFunctionalData] = useState<any>({});
  const [enduranceData, setEnduranceData] = useState<any>({});
  const [jumpData, setJumpData] = useState<any>({});
  const strengthSessionRef = React.useRef<any>(null);

  const { saveAllTests, saving } = useCentralizedTestSession(selectedAthleteId, selectedDate);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, name')
        .eq('user_status', 'active')
        .order('name');

      if (!error && data) {
        setUsers(data);
      }
    };

    fetchUsers();
  }, []);

  const handleSaveAllTests = async () => {
    if (!selectedAthleteId) {
      console.log('❌ Δεν έχει επιλεγεί αθλητής');
      return;
    }

    console.log('🔄 Έναρξη αποθήκευσης όλων των τεστ...');
    console.log('📊 Δεδομένα προς αποθήκευση:', {
      anthropometric: anthropometricData,
      functional: functionalData,
      endurance: enduranceData,
      jump: jumpData,
      strength: strengthSessionRef.current
    });

    const testData = {
      anthropometric: anthropometricData,
      functional: functionalData,
      endurance: enduranceData,
      jump: jumpData,
      strength: strengthSessionRef.current
    };

    const success = await saveAllTests(testData);
    
    if (success) {
      // Επαναφορά δεδομένων μετά την επιτυχή αποθήκευση
      setAnthropometricData({});
      setFunctionalData({});
      setEnduranceData({});
      setJumpData({});
      
      // Επαναφορά strength session
      if (strengthSessionRef.current?.reset) {
        strengthSessionRef.current.reset();
      }
    }
  };

  return {
    user,
    loading,
    isAuthenticated,
    Navigate,
    selectedAthleteId,
    setSelectedAthleteId,
    selectedDate,
    setSelectedDate,
    activeTab,
    setActiveTab,
    users,
    isCollapsed,
    setIsCollapsed,
    anthropometricData,
    setAnthropometricData,
    functionalData,
    setFunctionalData,
    enduranceData,
    setEnduranceData,
    jumpData,
    setJumpData,
    strengthSessionRef,
    handleSaveAllTests,
    saving
  };
};
