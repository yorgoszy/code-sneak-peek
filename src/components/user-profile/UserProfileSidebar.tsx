
import { 
  User, 
  BarChart3, 
  Activity, 
  Calendar,
  FileText,
  CreditCard,
  Brain,
  ShoppingCart,
  Video,
  CalendarDays,
  Tag,
  TrendingUp
} from "lucide-react";
import { BaseSidebar } from "@/components/sidebar/BaseSidebar";
import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { EnhancedAIChatDialog } from "@/components/ai-chat/EnhancedAIChatDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useAllPrograms } from "@/hooks/useAllPrograms";
import { useWorkoutCompletionsCache } from "@/hooks/useWorkoutCompletionsCache";

interface UserProfileSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userProfile: any;
  stats: any;
}

export const UserProfileSidebar = forwardRef<
  { refreshOffers: () => void },
  UserProfileSidebarProps
>(({ 
  isCollapsed, 
  setIsCollapsed, 
  activeTab, 
  setActiveTab,
  userProfile,
  stats
}, ref) => {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [availableOffers, setAvailableOffers] = useState(0);
  const [activePrograms, setActivePrograms] = useState(0);
  const [workoutCompletions, setWorkoutCompletions] = useState<any[]>([]);
  const isMobile = useIsMobile();
  const { data: allActivePrograms = [] } = useAllPrograms();
  const { getAllWorkoutCompletions } = useWorkoutCompletionsCache();

  // Εκθέτει τη συνάρτηση loadAvailableOffers στο parent component
  useImperativeHandle(ref, () => ({
    refreshOffers: loadAvailableOffers
  }));

  useEffect(() => {
    if (userProfile?.id) {
      loadAvailableOffers();
      loadActivePrograms();
    }
  }, [userProfile?.id, allActivePrograms, workoutCompletions]);

  // Load workout completions for accurate program filtering
  useEffect(() => {
    const loadCompletions = async () => {
      if (userProfile?.id && allActivePrograms.length > 0) {
        const userPrograms = allActivePrograms.filter(program => program.user_id === userProfile.id);
        if (userPrograms.length > 0) {
          const allCompletions = await getAllWorkoutCompletions();
          const userAssignmentIds = userPrograms.map(p => p.id);
          const userCompletions = allCompletions.filter(c => userAssignmentIds.includes(c.assignment_id));
          setWorkoutCompletions(userCompletions);
        }
      }
    };
    loadCompletions();
  }, [userProfile?.id, allActivePrograms.length, getAllWorkoutCompletions]);

  const loadActivePrograms = () => {
    if (!userProfile?.id) return;
    
    // Φιλτράρισμα προγραμμάτων για τον συγκεκριμένο χρήστη
    const userPrograms = allActivePrograms.filter(program => program.user_id === userProfile.id);
    
    // Calculate stats the same way as UserProfileProgramCards
    const calculateProgramStats = (assignment: any) => {
      const trainingDates = assignment.training_dates || [];
      const assignmentCompletions = workoutCompletions.filter(c => c.assignment_id === assignment.id);
      
      let completed = 0;
      let missed = 0;
      const total = trainingDates.length;
      const today = new Date();
      
      // Για κάθε training date, έλεγξε το status
      for (const date of trainingDates) {
        const completion = assignmentCompletions.find(c => c.scheduled_date === date);
        
        if (completion?.status === 'completed') {
          completed++;
        } else {
          // Έλεγχος αν έχει περάσει η ημερομηνία
          const workoutDate = new Date(date);
          const isPast = workoutDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          
          if (isPast || completion?.status === 'missed') {
            missed++;
          }
        }
      }
      
      // Το progress υπολογίζεται από completed + missed (όλες οι "ολοκληρωμένες" προπονήσεις)
      const processedWorkouts = completed + missed;
      const progress = total > 0 ? Math.round((processedWorkouts / total) * 100) : 0;
      
      return {
        completed,
        total,
        missed,
        progress
      };
    };

    // Calculate stats for each program
    const programsWithStats = userPrograms.map(assignment => ({
      assignment,
      stats: calculateProgramStats(assignment)
    }));

    // Φιλτράρισμα μόνο των ενεργών ατελών προγραμμάτων (όπως στο tab "Ενεργά")
    const activeIncompletePrograms = programsWithStats.filter(item => 
      item.assignment.status === 'active' && item.stats?.progress < 100
    );
    
    setActivePrograms(activeIncompletePrograms.length);
  };

  const loadAvailableOffers = async () => {
    if (!userProfile?.id) return;
    
    try {
      // Φόρτωση προσφορών
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .lte('start_date', new Date().toISOString().split('T')[0]);

      if (error) throw error;

      // Φόρτωση απορριμμένων προσφορών
      const { data: rejectedOffers, error: rejectedError } = await supabase
        .from('offer_rejections')
        .select('offer_id')
        .eq('user_id', userProfile.id);

      if (rejectedError) throw rejectedError;

      // Φόρτωση αποδεκτών προσφορών (από payments)
      const { data: acceptedOffers, error: acceptedError } = await supabase
        .from('payments')
        .select('offer_id')
        .eq('user_id', userProfile.id)
        .not('offer_id', 'is', null);

      if (acceptedError) throw acceptedError;

      const rejectedOfferIds = new Set(rejectedOffers?.map(r => r.offer_id) || []);
      const acceptedOfferIds = new Set(acceptedOffers?.map(p => p.offer_id) || []);
      
      // Φιλτράρισμα προσφορών για τον χρήστη
      const userOffers = data?.filter(offer => {
        // Αποκλεισμός απορριμμένων και αποδεκτών προσφορών
        if (rejectedOfferIds.has(offer.id) || acceptedOfferIds.has(offer.id)) return false;
        
        if (offer.visibility === 'all') return true;
        if (offer.visibility === 'individual' || offer.visibility === 'selected') {
          return offer.target_users?.includes(userProfile.id);
        }
        return false;
      }) || [];
      
      setAvailableOffers(userOffers.length);
    } catch (error) {
      console.error('Error loading available offers:', error);
    }
  };
  
  const menuItems = [
    { 
      icon: BarChart3, 
      label: "Επισκόπηση", 
      key: "overview",
      badge: null
    },
    { 
      icon: Activity, 
      label: "Προγράμματα", 
      key: "programs",
      badge: activePrograms > 0 ? activePrograms : null
    },
    { 
      icon: Calendar, 
      label: "Ημερολόγιο", 
      key: "calendar",
      badge: null
    },
    { 
      icon: FileText, 
      label: "Τεστ", 
      key: "tests",
      badge: stats.testsCount > 0 ? stats.testsCount : null
    },
    { 
      icon: TrendingUp, 
      label: "Πρόοδος", 
      key: "progress",
      badge: null
    },
    { 
      icon: CreditCard, 
      label: "Πληρωμές", 
      key: "payments",
      badge: stats.paymentsCount > 0 ? stats.paymentsCount : null
    },
    {
      icon: ShoppingCart,
      label: "Αγορές",
      key: "shop",
      badge: null
    },
    {
      icon: Tag,
      label: "Προσφορές",
      key: "offers",
      badge: availableOffers > 0 ? availableOffers : null
    },
    {
      icon: Video,
      label: "Online Coaching",
      key: "online-coaching",
      badge: null
    },
    {
      icon: CalendarDays,
      label: "Online Booking",
      key: "online-booking",
      badge: null
    },
  ];

  const handleAIChatClick = () => {
    setIsAIChatOpen(true);
  };

  const headerContent = (
    <div className="px-1">
      <h2 className={`font-semibold text-gray-800 truncate ${
        isMobile ? 'text-base' : 'text-sm'
      }`}>
        {userProfile.name}
      </h2>
      <p className={`text-gray-500 capitalize truncate ${
        isMobile ? 'text-sm' : 'text-xs'
      }`}>
        {userProfile.role}
      </p>
    </div>
  );

  const navigationContent = (
    <div className="space-y-1 md:space-y-2">
      {menuItems.map((item) => {
        const isActive = activeTab === item.key;
        return (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            className={`w-full flex items-center justify-between px-3 py-2 md:py-2 text-sm font-medium transition-colors hover:bg-gray-100 rounded-none ${
              isActive ? 'bg-[#cb8954]/10 text-black border-r-2 border-[#cb8954]' : 'text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {(!isCollapsed || isMobile) && <span className="truncate">{item.label}</span>}
            </div>
            {(!isCollapsed || isMobile) && item.badge && (
              <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                item.key === 'offers' ? 'bg-[#fa3055] text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
      
      {/* RidAI Προπονητής Button */}
      <button
        onClick={handleAIChatClick}
        className="w-full flex items-center space-x-3 px-3 py-2 md:py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 rounded-none border-t border-gray-200 mt-2 pt-4"
      >
        <Brain className="h-5 w-5 flex-shrink-0 text-[#cb8954]" />
        {(!isCollapsed || isMobile) && (
          <div className="flex flex-col items-start min-w-0">
            <span className="text-sm font-medium truncate">RidAI Προπονητής</span>
            <span className="text-xs text-gray-500 truncate">powered by hyperteam</span>
          </div>
        )}
      </button>
    </div>
  );

  const bottomContent = (!isCollapsed || isMobile) ? (
    <div className="space-y-2 px-1">
      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
        Γρήγορη Επισκόπηση
      </h3>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-50 p-2 rounded-none">
          <div className="font-semibold text-gray-800">{stats.programsCount}</div>
          <div className="text-gray-600 text-xs">Προγράμματα</div>
        </div>
        <div className="bg-gray-50 p-2 rounded-none">
          <div className="font-semibold text-gray-800">{stats.testsCount}</div>
          <div className="text-gray-600 text-xs">Τεστ</div>
        </div>
      </div>
    </div>
  ) : undefined;

  return (
    <>
      <BaseSidebar
        isCollapsed={isCollapsed && !isMobile}
        setIsCollapsed={setIsCollapsed}
        headerContent={headerContent}
        navigationContent={navigationContent}
        bottomContent={bottomContent}
      />
      
      <EnhancedAIChatDialog
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        athleteId={userProfile.id}
        athleteName={userProfile.name}
        athletePhotoUrl={userProfile.photo_url}
      />
    </>
  );
});
