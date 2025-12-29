import { 
  Home, 
  Users, 
  ArrowLeft,
  Brain,
  CreditCard,
  TrendingUp,
  BarChart3,
  Settings,
  FileText,
  Calendar,
  Layers
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { BaseSidebar } from "@/components/sidebar/BaseSidebar";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useState } from "react";
import { EnhancedAIChatDialog } from "@/components/ai-chat/EnhancedAIChatDialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface CoachSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  /**
   * When an admin is viewing a coach profile, we want sidebar actions
   * (like "Οι Αθλητές μου") to act "as that coach".
   */
  contextCoachId?: string;
}

export const CoachSidebar = ({
  isCollapsed,
  setIsCollapsed,
  contextCoachId,
}: CoachSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, isAdmin } = useRoleCheck();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const isMobile = useIsMobile();

  const effectiveCoachId =
    contextCoachId && isAdmin() ? contextCoachId : (userProfile?.id as string | undefined);

  const menuItems = [
    {
      icon: Home,
      label: "Επισκόπηση",
      path: effectiveCoachId ? `/dashboard/coach-overview?coachId=${effectiveCoachId}` : "/dashboard/coach-overview",
      badge: null,
    },
    {
      icon: Users,
      label: "Οι Αθλητές μου",
      path: effectiveCoachId ? `/dashboard/my-athletes?coachId=${effectiveCoachId}` : "/dashboard/my-athletes",
      badge: null,
    },
    {
      icon: CreditCard,
      label: "Συνδρομές",
      path: effectiveCoachId ? `/dashboard/coach-subscriptions?coachId=${effectiveCoachId}` : "/dashboard/coach-subscriptions",
      badge: null,
    },
    { type: "separator" },
    {
      icon: FileText,
      label: "Προγράμματα",
      path: effectiveCoachId ? `/dashboard/coach-programs?coachId=${effectiveCoachId}` : "/dashboard/coach-programs",
      badge: null,
    },
    {
      icon: Calendar,
      label: "Ενεργά Προγράμματα",
      path: effectiveCoachId ? `/dashboard/coach-active-programs?coachId=${effectiveCoachId}` : "/dashboard/coach-active-programs",
      badge: null,
    },
    {
      icon: Layers,
      label: "Program Cards",
      path: effectiveCoachId ? `/dashboard/coach-program-cards?coachId=${effectiveCoachId}` : "/dashboard/coach-program-cards",
      badge: null,
    },
    { type: "separator" },
    {
      icon: TrendingUp,
      label: "Τεστ",
      path: effectiveCoachId ? `/dashboard/coach-progress?coachId=${effectiveCoachId}` : "/dashboard/coach-progress",
      badge: null,
    },
    {
      icon: BarChart3,
      label: "Πρόοδος Αθλητών",
      path: effectiveCoachId ? `/dashboard/coach-athletes-progress?coachId=${effectiveCoachId}` : "/dashboard/coach-athletes-progress",
      badge: null,
    },
    {
      icon: Settings,
      label: "Ρυθμίσεις Προφίλ",
      path: effectiveCoachId ? `/dashboard/coach-profile?coachId=${effectiveCoachId}` : "/dashboard/coach-profile",
      badge: null,
    },
    { type: "separator" },
    {
      icon: ArrowLeft,
      label: "Επιστροφή στην Αρχική",
      path: "/",
      badge: null,
    },
  ];

  const handleMenuClick = (item: any) => {
    if (item.external) {
      window.open(item.path, '_blank');
    } else {
      navigate(item.path);
    }
  };

  const handleAIChatClick = () => {
    setIsAIChatOpen(true);
  };

  const headerContent = (
    <div>
      <h2 className={`font-semibold text-foreground ${isMobile ? "text-base" : "text-sm"}`}>
        Coach Panel
      </h2>
      <p className={`text-muted-foreground ${isMobile ? "text-sm" : "text-xs"}`}>
        Διαχείριση αθλητών
      </p>
    </div>
  );

  const navigationContent = (
    <div className={`space-y-1 ${isMobile ? "md:space-y-2" : "space-y-2"}`}>
      {menuItems.map((item, index) => {
        if (item.type === "separator") {
          return <div key={`separator-${index}`} className="my-2 h-px bg-border" />;
        }

        const pathWithoutQuery = typeof item.path === "string" ? item.path.split("?")[0] : "";
        const isActive =
          location.pathname === pathWithoutQuery ||
          (pathWithoutQuery.startsWith("/dashboard/my-athletes") &&
            location.pathname === "/dashboard/my-athletes") ||
          (pathWithoutQuery.startsWith("/dashboard/coach-subscriptions") &&
            location.pathname === "/dashboard/coach-subscriptions") ||
          (pathWithoutQuery.startsWith("/dashboard/coach-progress") &&
            location.pathname === "/dashboard/coach-progress") ||
          (pathWithoutQuery.startsWith("/dashboard/coach-athletes-progress") &&
            location.pathname === "/dashboard/coach-athletes-progress");

        return (
          <button
            key={item.path}
            onClick={() => handleMenuClick(item)}
            className={
              "w-full flex items-center justify-between px-3 py-2 text-sm font-medium transition-colors rounded-none " +
              (isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground border-r-2 border-r-[hsl(var(--auth-gold))]"
                : "text-sidebar-foreground hover:bg-sidebar-accent")
            }
          >
            <div className="flex items-center space-x-3 min-w-0">
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {(!isCollapsed || isMobile) && <span className="truncate">{item.label}</span>}
            </div>

            {(!isCollapsed || isMobile) && item.badge && (
              <span className="text-xs px-2 py-1 rounded-none flex-shrink-0 bg-destructive text-destructive-foreground">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}

      {/* RidAI Προπονητής Button */}
      <button
        onClick={handleAIChatClick}
        className="w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent rounded-none border-t border-border mt-2 pt-4"
      >
        <Brain className="h-5 w-5 flex-shrink-0 text-[hsl(var(--auth-gold))]" />
        {(!isCollapsed || isMobile) && (
          <div className="flex flex-col items-start min-w-0">
            <span className="text-sm font-medium truncate">RidAI Προπονητής</span>
            <span className="text-xs text-muted-foreground truncate">powered by hyperteam</span>
          </div>
        )}
      </button>
    </div>
  );

  return (
    <>
      <BaseSidebar
        isCollapsed={isCollapsed && !isMobile}
        setIsCollapsed={setIsCollapsed}
        headerContent={headerContent}
        navigationContent={navigationContent}
      />
      
      <EnhancedAIChatDialog
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        athleteId={userProfile?.id}
        athleteName={userProfile?.name}
        athletePhotoUrl={userProfile?.photo_url}
      />
    </>
  );
};
