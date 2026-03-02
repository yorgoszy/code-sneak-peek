import {
  Home,
  Users,
  TrendingUp,
  Settings,
  LogOut,
  Building2,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { BaseSidebar } from "@/components/sidebar/BaseSidebar";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useAuth } from "@/hooks/useAuth";

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

  const menuItems = [
    {
      icon: Home,
      label: "Επισκόπηση",
      path: "/dashboard/federation-overview",
    },
    {
      icon: Users,
      label: "Χρήστες",
      path: "/dashboard/federation-users",
    },
    {
      icon: TrendingUp,
      label: "Πρόοδος",
      path: "/dashboard/federation-progress",
    },
    {
      icon: Settings,
      label: "Επεξεργασία Προφίλ",
      path: "/dashboard/federation-profile",
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  const headerContent = (
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 rounded-none flex items-center justify-center bg-[#cb8954]/20">
        <Building2 className="w-6 h-6 text-[#cb8954]" />
      </div>
      {!isCollapsed && (
        <div>
          <h2 className="font-bold text-sm text-foreground">Ομοσπονδία</h2>
          <p className="text-xs text-muted-foreground truncate max-w-[160px]">
            {userProfile?.name || "Federation Panel"}
          </p>
        </div>
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
              ? "bg-[#00ffba]/10 text-[#00ffba] font-medium border-r-2 border-[#00ffba]"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <item.icon className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>{item.label}</span>}
        </button>
      ))}
    </div>
  );

  const bottomContent = (
    <div className="space-y-1">
      <button
        onClick={() => signOut()}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors rounded-none"
      >
        <LogOut className="w-5 h-5 flex-shrink-0" />
        {!isCollapsed && <span>Αποσύνδεση</span>}
      </button>
    </div>
  );

  return (
    <BaseSidebar
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
      headerContent={headerContent}
      navigationContent={navigationContent}
      bottomContent={bottomContent}
    />
  );
};
