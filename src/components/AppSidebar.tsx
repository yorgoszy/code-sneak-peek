import React from 'react';
import { 
  Home, 
  Users, 
  Dumbbell, 
  Calendar, 
  BarChart3, 
  Settings,
  FileText,
  CreditCard,
  UsersIcon,
  Crown,
  TrendingUp,
  BookOpen,
  ShoppingCart,
  Video,
  Tag
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useRoleCheck } from "@/hooks/useRoleCheck";

const menuItems = [
  { 
    icon: Home, 
    label: "Αρχική", 
    path: "/dashboard"
  },
  { 
    icon: Users, 
    label: "Χρήστες", 
    path: "/dashboard/users"
  },
  { 
    icon: UsersIcon, 
    label: "Ομάδες", 
    path: "/dashboard/groups"
  },
  { 
    icon: Crown, 
    label: "Συνδρομές RID", 
    path: "/dashboard/subscriptions"
  },
  {
    icon: ShoppingCart,
    label: "Αγορές",
    path: "/dashboard/shop"
  },
  {
    icon: Tag,
    label: "Προσφορές",
    path: "/dashboard/offers"
  },
  {
    icon: Video,
    label: "Online Coaching",
    path: "/dashboard/online-coaching"
  },
  {
    icon: Calendar,
    label: "Online Booking",
    path: "/dashboard/online-booking"
  },
  {
    icon: Settings,
    label: "Διαχείριση Τμημάτων",
    path: "/dashboard/booking-sections"
  },
  { 
    icon: Calendar, 
    label: "Προγράμματα", 
    path: "/dashboard/programs"
  },
  { 
    icon: BarChart3, 
    label: "Ενεργά Προγράμματα", 
    path: "/dashboard/active-programs"
  },
  { 
    icon: CreditCard, 
    label: "Program Cards", 
    path: "/dashboard/program-cards"
  },
  { 
    icon: FileText, 
    label: "Τεστ", 
    path: "/dashboard/tests"
  },
  { 
    icon: Dumbbell, 
    label: "Ασκήσεις", 
    path: "/dashboard/exercises"
  },
  {
    icon: TrendingUp,
    label: "Analytics",
    path: "/dashboard/analytics"
  },
  { 
    icon: BookOpen, 
    label: "Άρθρα", 
    path: "/dashboard/articles"
  },
  { 
    icon: BarChart3, 
    label: "Αποτελέσματα", 
    path: "/dashboard/results"
  }
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile } = useRoleCheck();
  const { state } = useSidebar();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Μενού</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.path)}
                    isActive={isActive(item.path)}
                    tooltip={item.label}
                    className="rounded-none"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}