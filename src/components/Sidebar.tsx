
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

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar = ({ isCollapsed, setIsCollapsed }: SidebarProps) => {
  const location = useLocation();

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

  const headerContent = null;

  const navigationContent = (
    <div className="space-y-1">
      {menuItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center justify-center p-3 text-sm font-medium transition-colors hover:bg-gray-100 rounded-none ${
              isActive ? 'bg-[#00ffba]/10 text-[#00ffba] border-r-2 border-[#00ffba]' : 'text-gray-700'
            }`}
            title={item.label}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
          </Link>
        );
      })}
    </div>
  );

  const bottomContent = (
    <div className="space-y-1">
      <Link
        to="/"
        className="flex items-center justify-center p-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 rounded-none"
        title="Επιστροφή στην Αρχική"
      >
        <Home className="h-5 w-5 flex-shrink-0" />
      </Link>

      <a
        href="https://webmail.hyperkids.gr/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center p-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 rounded-none"
        title="Webmail"
      >
        <Mail className="h-5 w-5 flex-shrink-0" />
      </a>
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
