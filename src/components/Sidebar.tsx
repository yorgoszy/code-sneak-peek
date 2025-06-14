
import { useLocation } from "react-router-dom";
import { 
  Users, 
  UserPlus, 
  Activity, 
  Dumbbell, 
  TrendingUp, 
  FileText,
  Calendar,
  BarChart3,
  Home,
  Mail,
  CalendarCheck,
  CreditCard
} from "lucide-react";
import { BaseSidebar } from "@/components/sidebar/BaseSidebar";
import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  iconOnly?: boolean; // obsolete now, kept for backwards compatibility
}

export const Sidebar = ({ isCollapsed, setIsCollapsed }: SidebarProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();

  const menuItems = [
    { icon: BarChart3, label: "Επισκόπηση", path: "/dashboard" },
    { icon: Users, label: "Χρήστες", path: "/dashboard/users" },
    { icon: UserPlus, label: "Ομάδες", path: "/dashboard/groups" },
    { icon: Dumbbell, label: "Ασκήσεις", path: "/dashboard/exercises" },
    { icon: Activity, label: "Τεστ", path: "/dashboard/tests" },
    { icon: TrendingUp, label: "Αποτελέσματα", path: "/dashboard/results" },
    { icon: Calendar, label: "Προγράμματα", path: "/dashboard/programs" },
    { icon: CalendarCheck, label: "Ημερολόγιο", path: "/dashboard/active-programs" },
    { icon: CreditCard, label: "Program Cards", path: "/dashboard/program-cards" },
  ];

  const headerContent = (
    <div>
      <h2 className="text-sm font-semibold text-gray-800">HyperKids</h2>
      <p className="text-xs text-gray-500">Διαχείριση προπονήσεων</p>
    </div>
  );

  const navigationContent = (
    <TooltipProvider>
      <div className="space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Tooltip key={item.path} disableHoverableContent={isMobile ? false : true}>
              <TooltipTrigger asChild>
                <Link
                  to={item.path}
                  className={`flex items-center ${isMobile || isCollapsed ? "justify-center" : "justify-start"} px-0 py-2 text-sm font-medium transition-colors hover:bg-gray-100 rounded-none ${
                    isActive ? 'bg-[#00ffba]/10 text-[#00ffba] border-r-2 border-[#00ffba]' : 'text-gray-700'
                  }`}
                  style={{ width: "100%" }}
                  aria-label={item.label}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {/* Show label only if not iconOnly/collapsed/mobile */}
                  {!isMobile && !isCollapsed && (
                    <span className="ml-3">{item.label}</span>
                  )}
                </Link>
              </TooltipTrigger>
              {isMobile || isCollapsed ? (
                <TooltipContent side="right" sideOffset={4}>
                  {item.label}
                </TooltipContent>
              ) : null}
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );

  const bottomContent = (
    <TooltipProvider>
      <div className="space-y-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/"
              className={`flex items-center ${isMobile || isCollapsed ? "justify-center" : "justify-start"} px-0 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 rounded-none`}
              aria-label="Επιστροφή στην Αρχική"
            >
              <Home className="h-5 w-5 flex-shrink-0" />
            </Link>
          </TooltipTrigger>
          {(isMobile || isCollapsed) && (
            <TooltipContent side="right" sideOffset={4}>Επιστροφή στην Αρχική</TooltipContent>
          )}
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href="https://webmail.hyperkids.gr/"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center ${isMobile || isCollapsed ? "justify-center" : "justify-start"} px-0 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 rounded-none`}
              aria-label="Webmail"
            >
              <Mail className="h-5 w-5 flex-shrink-0" />
            </a>
          </TooltipTrigger>
          {(isMobile || isCollapsed) && (
            <TooltipContent side="right" sideOffset={4}>Webmail</TooltipContent>
          )}
        </Tooltip>
      </div>
    </TooltipProvider>
  );

  return (
    <BaseSidebar
      isCollapsed={isMobile ? true : isCollapsed}
      setIsCollapsed={setIsCollapsed}
      headerContent={headerContent}
      navigationContent={navigationContent}
      bottomContent={bottomContent}
      className="!w-16 min-w-0 max-w-16 md:!w-64 md:max-w-64 md:min-w-[16rem]"
    />
  );
};
