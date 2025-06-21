
import { 
  Home, 
  Users, 
  Dumbbell, 
  Calendar, 
  BarChart3, 
  Settings,
  FileText,
  CreditCard,
  Brain,
  UsersIcon,
  Mail,
  ArrowLeft,
  Crown
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader
} from "@/components/ui/sidebar";
import { SmartAIChatDialog } from "@/components/ai-chat/SmartAIChatDialog";
import { useRoleCheck } from "@/hooks/useRoleCheck";

export const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile } = useRoleCheck();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  const menuItems = [
    { 
      icon: Home, 
      label: "Αρχική", 
      path: "/dashboard",
      badge: null
    },
    { 
      icon: Users, 
      label: "Χρήστες", 
      path: "/dashboard/users",
      badge: null
    },
    { 
      icon: UsersIcon, 
      label: "Ομάδες", 
      path: "/dashboard/groups",
      badge: null
    },
    { 
      icon: Crown, 
      label: "Συνδρομές RID", 
      path: "/dashboard/subscriptions",
      badge: null
    },
    { 
      icon: Dumbbell, 
      label: "Ασκήσεις", 
      path: "/dashboard/exercises",
      badge: null
    },
    { 
      icon: Calendar, 
      label: "Προγράμματα", 
      path: "/dashboard/programs",
      badge: null
    },
    { 
      icon: BarChart3, 
      label: "Ενεργά Προγράμματα", 
      path: "/dashboard/active-programs",
      badge: null
    },
    { 
      icon: CreditCard, 
      label: "Program Cards", 
      path: "/dashboard/program-cards",
      badge: null
    },
    { 
      icon: FileText, 
      label: "Τεστ", 
      path: "/dashboard/tests",
      badge: null
    },
    {
      icon: BarChart3,
      label: "Αποτελέσματα",
      path: "/dashboard/results",
      badge: null
    },
    {
      icon: Mail,
      label: "Webmail",
      path: "https://webmail.hyperkids.gr/",
      badge: null,
      external: true
    },
    {
      icon: ArrowLeft,
      label: "Επιστροφή στην Αρχική",
      path: "/",
      badge: null
    }
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

  return (
    <>
      <Sidebar>
        <SidebarHeader className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-none flex items-center justify-center overflow-hidden">
              <img 
                src="/lovable-uploads/a9d8f326-52a1-4283-965a-c73fed3f73ec.png" 
                alt="Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">
                Admin Panel
              </h2>
              <p className="text-xs text-gray-500">Διαχείριση συστήματος</p>
            </div>
          </div>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Διαχείριση</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path && !item.external;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        onClick={() => handleMenuClick(item)}
                        className={`w-full flex items-center justify-between rounded-none ${
                          isActive ? 'bg-[#00ffba]/10 text-[#00ffba] border-r-2 border-[#00ffba]' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={handleAIChatClick}
                    className="w-full flex items-center space-x-3 rounded-none border-t border-gray-200 mt-2 pt-4"
                  >
                    <Brain className="h-5 w-5 flex-shrink-0 text-[#00ffba]" />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">Έξυπνος AI Προπονητής</span>
                      <span className="text-xs text-gray-500">Μαθαίνει & θυμάται</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      
      <SmartAIChatDialog
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        athleteId={userProfile?.id}
        athleteName={userProfile?.name}
      />
    </>
  );
};
