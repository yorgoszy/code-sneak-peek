import {
  Home,
  Users,
  TrendingUp,
  Settings,
  LogOut,
  Building2,
  
  Brain,
  CreditCard,
  Swords,
  Trophy,
  Shuffle,
  Radio,
  ClipboardList,
  Scale,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BaseSidebar } from "@/components/sidebar/BaseSidebar";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useAuth } from "@/hooks/useAuth";
import { EnhancedAIChatDialog } from "@/components/ai-chat/EnhancedAIChatDialog";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface FederationSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const FederationSidebar = ({
  isCollapsed,
  setIsCollapsed,
}: FederationSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile } = useRoleCheck();
  const { signOut } = useAuth();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const { t } = useTranslation();

  const menuItems = [
    { icon: Home, label: t("federation.sidebar.overview"), path: "/dashboard/federation-overview" },
    { icon: Users, label: t("federation.sidebar.users"), path: "/dashboard/federation-users" },
    { icon: CreditCard, label: t("federation.sidebar.subscriptions"), path: "/dashboard/federation-subscriptions" },
    { icon: Swords, label: t("federation.sidebar.competitions"), path: "/dashboard/federation-competitions" },
    { icon: Scale, label: t("federation.sidebar.weighIn"), path: "/dashboard/weigh-in" },
    { icon: Shuffle, label: t("federation.sidebar.brackets"), path: "/dashboard/federation-brackets" },
    { icon: Radio, label: t("federation.sidebar.live"), path: "/dashboard/federation-live" },
    { icon: ClipboardList, label: t("federation.sidebar.fightCard"), path: "/dashboard/federation-fight-card" },
    { icon: Trophy, label: "Ranking", path: "/dashboard/ranking" },
    { icon: TrendingUp, label: "Athletes Progress", path: "/dashboard/federation-progress" },
    
    { icon: Brain, label: "AI Lab", path: "/dashboard/ai-lab" },
    { icon: Settings, label: t("federation.sidebar.editProfile"), path: "/dashboard/federation-profile" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const headerContent = (
    <div className="flex items-center justify-between">
      {!isCollapsed && (
        <>
          <div>
            <h2 className="font-bold text-sm text-foreground">{t("federation.title")}</h2>
            <p className="text-xs text-muted-foreground truncate max-w-[130px]">
              {userProfile?.name || t("federation.panel")}
            </p>
          </div>
          <LanguageSwitcher />
        </>
      )}
    </div>
  );

  const navigationContent = (
    <div className="space-y-1">
      {menuItems.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors rounded-none ${
            isActive(item.path)
              ? "bg-black/10 text-foreground font-medium border-r-2 border-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <item.icon className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>{item.label}</span>}
        </button>
      ))}

      {/* RidAI Βοηθός Button */}
      <div className="my-2 h-px bg-border" />
      <button
        onClick={() => setIsAIChatOpen(true)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors rounded-none"
      >
        <Brain className="w-5 h-5 flex-shrink-0" />
        {!isCollapsed && (
          <div className="flex flex-col items-start min-w-0">
            <span className="text-sm font-medium truncate">RidAI Βοηθός</span>
            <span className="text-xs text-muted-foreground truncate">powered by hyperteam</span>
          </div>
        )}
      </button>

    </div>
  );

  const bottomContent = (
    <div className="space-y-1">
      <button
        onClick={() => signOut()}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors rounded-none"
      >
        <LogOut className="w-5 h-5 flex-shrink-0" />
        {!isCollapsed && <span>{t("federation.sidebar.signOut")}</span>}
      </button>
    </div>
  );

  return (
    <>
      <BaseSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        headerContent={headerContent}
        navigationContent={navigationContent}
        bottomContent={bottomContent}
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
