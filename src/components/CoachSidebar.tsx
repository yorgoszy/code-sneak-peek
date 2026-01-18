import {
  Home,
  Users,
  UsersRound,
  ArrowLeft,
  Brain,
  CreditCard,
  TrendingUp,
  BarChart3,
  Settings,
  FileText,
  Calendar,
  Layers,
  CalendarDays,
  Utensils,
  LogOut,
  Dumbbell,
  ShoppingBag,
  Award,
  Lock,
  Video,
  Timer,
  Compass,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { BaseSidebar } from "@/components/sidebar/BaseSidebar";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useState } from "react";
import { EnhancedAIChatDialog } from "@/components/ai-chat/EnhancedAIChatDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { FEATURE_FLAGS } from "@/config/featureFlags";
import { useTranslation } from 'react-i18next';
import { useCoachSubscriptionStatus } from "@/hooks/useCoachSubscriptionStatus";
import { toast } from "sonner";

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
  const { signOut } = useAuth();
  const { t } = useTranslation();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const isMobile = useIsMobile();

  const effectiveCoachId =
    contextCoachId && isAdmin() ? contextCoachId : (userProfile?.id as string | undefined);

  // Check coach subscription status
  const { isActive: isCoachActive, isLoading: isSubscriptionLoading } = useCoachSubscriptionStatus(effectiveCoachId);

  // Admins always have full access
  const hasFullAccess = isAdmin() || isCoachActive;

  // Menu items that require active subscription
  const restrictedPaths = [
    '/dashboard/coach-subscriptions',
    '/dashboard/coach-programs',
    '/dashboard/coach-active-programs',
    '/dashboard/coach-program-cards',
    '/dashboard/annual-planning',
    '/dashboard/nutrition',
    '/dashboard/coach-progress',
    '/dashboard/coach-athletes-progress',
    '/dashboard/coach-goals-awards',
  ];

  const menuItems = [
    {
      icon: Home,
      label: "Επισκόπηση",
      path: effectiveCoachId ? `/dashboard/coach-overview?coachId=${effectiveCoachId}` : "/dashboard/coach-overview",
      badge: null,
      requiresSubscription: false,
    },
    {
      icon: Users,
      label: "Οι Αθλητές μου",
      path: effectiveCoachId ? `/dashboard/my-athletes?coachId=${effectiveCoachId}` : "/dashboard/my-athletes",
      badge: null,
      requiresSubscription: true,
    },
    {
      icon: UsersRound,
      label: "Ομάδες",
      path: effectiveCoachId ? `/dashboard/coach-groups?coachId=${effectiveCoachId}` : "/dashboard/coach-groups",
      badge: null,
      requiresSubscription: true,
    },
    {
      icon: CreditCard,
      label: "Συνδρομές",
      path: effectiveCoachId ? `/dashboard/coach-subscriptions?coachId=${effectiveCoachId}` : "/dashboard/coach-subscriptions",
      badge: null,
      requiresSubscription: true,
    },
    {
      icon: ShoppingBag,
      label: "Shop",
      path: effectiveCoachId ? `/dashboard/coach-shop?coachId=${effectiveCoachId}` : "/dashboard/coach-shop",
      badge: null,
      requiresSubscription: false,
    },

    // Προσωρινά κρυμμένο
    ...(FEATURE_FLAGS.coachExercisesPage
      ? [
          {
            icon: Dumbbell,
            label: "Ασκήσεις",
            path: effectiveCoachId ? `/dashboard/coach-exercises?coachId=${effectiveCoachId}` : "/dashboard/coach-exercises",
            badge: null,
            requiresSubscription: false,
          },
        ]
      : []),

    { type: "separator" },
    {
      icon: FileText,
      label: "Προγράμματα",
      path: effectiveCoachId ? `/dashboard/coach-programs?coachId=${effectiveCoachId}` : "/dashboard/coach-programs",
      badge: null,
      requiresSubscription: true,
    },
    {
      icon: Calendar,
      label: "Ενεργά Προγράμματα",
      path: effectiveCoachId ? `/dashboard/coach-active-programs?coachId=${effectiveCoachId}` : "/dashboard/coach-active-programs",
      badge: null,
      requiresSubscription: true,
    },
    {
      icon: Layers,
      label: "Program Cards",
      path: effectiveCoachId ? `/dashboard/coach-program-cards?coachId=${effectiveCoachId}` : "/dashboard/coach-program-cards",
      badge: null,
      requiresSubscription: true,
    },
    {
      icon: CalendarDays,
      label: "Ετήσιος Προγραμματισμός",
      path: effectiveCoachId ? `/dashboard/annual-planning?coachId=${effectiveCoachId}` : "/dashboard/annual-planning",
      badge: null,
      requiresSubscription: true,
    },
    {
      icon: Utensils,
      label: t('sidebar.nutrition'),
      path: effectiveCoachId ? `/dashboard/nutrition?coachId=${effectiveCoachId}` : "/dashboard/nutrition",
      badge: null,
      requiresSubscription: true,
    },
    { type: "separator" },
    {
      icon: TrendingUp,
      label: "Τεστ",
      path: effectiveCoachId ? `/dashboard/coach-progress?coachId=${effectiveCoachId}` : "/dashboard/coach-progress",
      badge: null,
      requiresSubscription: true,
    },
    {
      icon: BarChart3,
      label: "Πρόοδος Αθλητών",
      path: effectiveCoachId ? `/dashboard/coach-athletes-progress?coachId=${effectiveCoachId}` : "/dashboard/coach-athletes-progress",
      badge: null,
      requiresSubscription: true,
    },
    {
      icon: Award,
      label: "Στόχοι & Βραβεία",
      path: effectiveCoachId ? `/dashboard/coach-goals-awards?coachId=${effectiveCoachId}` : "/dashboard/coach-goals-awards",
      badge: null,
      requiresSubscription: true,
    },
    {
      icon: Video,
      label: "Video Analysis",
      path: effectiveCoachId ? `/dashboard/video-analysis?coachId=${effectiveCoachId}` : "/dashboard/video-analysis",
      badge: null,
      requiresSubscription: true,
    },
    {
      icon: Timer,
      label: "Sprint Timer",
      path: effectiveCoachId ? `/dashboard/sprint-timer?coachId=${effectiveCoachId}` : "/dashboard/sprint-timer",
      badge: null,
      requiresSubscription: true,
    },
    {
      icon: Compass,
      label: "Change Direction",
      path: effectiveCoachId ? `/dashboard/change-direction?coachId=${effectiveCoachId}` : "/dashboard/change-direction",
      badge: null,
      requiresSubscription: true,
    },
    {
      icon: Brain,
      label: "Cognitive",
      path: effectiveCoachId ? `/dashboard/cognitive?coachId=${effectiveCoachId}` : "/dashboard/cognitive",
      badge: null,
      requiresSubscription: true,
    },
    {
      icon: Settings,
      label: "Ρυθμίσεις Προφίλ",
      path: effectiveCoachId ? `/dashboard/coach-profile?coachId=${effectiveCoachId}` : "/dashboard/coach-profile",
      badge: null,
      requiresSubscription: false,
    },
    { type: "separator" },
    {
      icon: ArrowLeft,
      label: "Επιστροφή στην Αρχική",
      path: "/",
      badge: null,
      requiresSubscription: false,
    },
    {
      icon: LogOut,
      label: "Αποσύνδεση",
      path: "logout",
      badge: null,
      requiresSubscription: false,
    },
  ];

  const handleMenuClick = async (item: any) => {
    // Check if item requires subscription and coach is not active
    if (item.requiresSubscription && !hasFullAccess) {
      toast.error('Απαιτείται ενεργή συνδρομή HYPERsync για πρόσβαση σε αυτή τη λειτουργία');
      navigate(effectiveCoachId ? `/dashboard/coach-shop?coachId=${effectiveCoachId}` : "/dashboard/coach-shop");
      return;
    }

    if (item.path === "logout") {
      await signOut();
      navigate("/auth");
      return;
    }
    if (item.external) {
      window.open(item.path, "_blank");
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
      {!isSubscriptionLoading && !hasFullAccess && (
        <p className="text-xs text-amber-500 mt-1">
          Ενεργοποιήστε το HYPERsync
        </p>
      )}
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
          (pathWithoutQuery.startsWith("/dashboard/my-athletes") && location.pathname === "/dashboard/my-athletes") ||
          (pathWithoutQuery.startsWith("/dashboard/coach-subscriptions") &&
            location.pathname === "/dashboard/coach-subscriptions") ||
          (pathWithoutQuery.startsWith("/dashboard/coach-progress") && location.pathname === "/dashboard/coach-progress") ||
          (pathWithoutQuery.startsWith("/dashboard/coach-athletes-progress") &&
            location.pathname === "/dashboard/coach-athletes-progress");

        const isDisabled = item.requiresSubscription && !hasFullAccess;

        return (
          <button
            key={item.path}
            onClick={() => handleMenuClick(item)}
            disabled={isDisabled}
            className={
              "w-full flex items-center justify-between px-3 py-2 text-sm font-medium transition-colors rounded-none " +
              (isDisabled
                ? "text-muted-foreground/50 cursor-not-allowed opacity-50"
                : isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground border-r-2 border-r-[hsl(var(--auth-gold))]"
                  : "text-sidebar-foreground hover:bg-sidebar-accent")
            }
          >
            <div className="flex items-center space-x-3 min-w-0">
              {isDisabled ? (
                <Lock className="h-5 w-5 flex-shrink-0 text-muted-foreground/50" />
              ) : (
                <item.icon className="h-5 w-5 flex-shrink-0" />
              )}
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
        onClick={() => {
          if (!hasFullAccess) {
            toast.error('Απαιτείται ενεργή συνδρομή HYPERsync για πρόσβαση σε αυτή τη λειτουργία');
            navigate(effectiveCoachId ? `/dashboard/coach-shop?coachId=${effectiveCoachId}` : "/dashboard/coach-shop");
            return;
          }
          handleAIChatClick();
        }}
        disabled={!hasFullAccess}
        className={
          "w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium transition-colors rounded-none border-t border-border mt-2 pt-4 " +
          (!hasFullAccess
            ? "text-muted-foreground/50 cursor-not-allowed opacity-50"
            : "text-sidebar-foreground hover:bg-sidebar-accent")
        }
      >
        {!hasFullAccess ? (
          <Lock className="h-5 w-5 flex-shrink-0 text-muted-foreground/50" />
        ) : (
          <Brain className="h-5 w-5 flex-shrink-0 text-[hsl(var(--auth-gold))]" />
        )}
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
