import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { UserProgressSection } from "@/components/user-profile/UserProgressSection";
import { supabase } from "@/integrations/supabase/client";

const UserProgressHistory = () => {
  const { userId } = useParams<{ userId: string }>();
  const { signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const isMobile = useIsMobile();

  // Check for tablet size
  useEffect(() => {
    const checkTablet = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    
    checkTablet();
    window.addEventListener('resize', checkTablet);
    return () => window.removeEventListener('resize', checkTablet);
  }, []);

  // Fetch user name
  useEffect(() => {
    const fetchUserName = async () => {
      if (!userId) return;
      
      const { data, error } = await supabase
        .from('app_users')
        .select('name')
        .eq('id', userId)
        .single();
      
      if (data && !error) {
        setUserName(data.name);
      }
    };
    
    fetchUserName();
  }, [userId]);

  const handleSignOut = async () => {
    await signOut();
  };

  if (!userId) {
    return <div>Δεν βρέθηκε χρήστης</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <div className={`${isTablet ? 'absolute z-50' : ''}`}>
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
          </div>
        )}

        {/* Mobile Sidebar */}
        {isMobile && showMobileSidebar && (
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowMobileSidebar(false)}>
            <div className="w-64 h-full bg-white" onClick={(e) => e.stopPropagation()}>
              <Sidebar isCollapsed={false} setIsCollapsed={() => {}} />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          {isMobile && (
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMobileSidebar(true)}
                className="rounded-none"
              >
                <Menu className="h-6 w-6" />
              </Button>
              <h1 className="text-lg font-semibold">Ιστορικό Προόδου</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="rounded-none"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          )}
          
          <div className="p-6 space-y-6 overflow-y-auto">
            <div>
              <h1 className="text-2xl font-bold">Ιστορικό Προόδου</h1>
              {userName && <p className="text-gray-600 mt-1">{userName}</p>}
            </div>

            {/* Χρησιμοποιούμε το UserProgressSection που ήδη υπάρχει και δείχνει όλες τις κάρτες */}
            <UserProgressSection userId={userId} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProgressHistory;
