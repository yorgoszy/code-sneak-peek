import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';
import { Button } from "@/components/ui/button";
import { Globe, LogOut, LayoutDashboard } from "lucide-react";
import hyperkidsLogo from '@/assets/hyperkids-logo-new.png';

const defaultNavItems = [
  { name: 'Αρχική', href: '#home' },
  { name: 'Προγράμματα', href: '#programs' },
  { name: 'Σχετικά', href: '#about' },
  { name: 'Blog', href: '#blog' },
  { name: 'Αποτελέσματα', href: '#results' },
  { name: 'Επικοινωνία', href: '#footer' },
];

export const NavigationSectionComponent: UserComponent = () => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div 
      ref={(ref) => ref && connect(drag(ref))}
      className="relative"
    >
      <nav className="w-full bg-black z-50">
        <style>{`
          .nav-link-builder {
            color: white !important;
          }
          .nav-link-builder:hover {
            color: #cf8d54 !important;
          }
          .login-btn-builder {
            background-color: transparent !important;
            border: 1px solid white !important;
            color: white !important;
          }
          .login-btn-builder:hover {
            background-color: white !important;
            color: black !important;
          }
        `}</style>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src={hyperkidsLogo} 
                alt="HyperKids Logo" 
                className="h-5 w-auto"
              />
            </div>
            
            <div className="hidden lg:flex items-center space-x-8">
              {defaultNavItems.map((item) => (
                <span
                  key={item.name}
                  className="nav-link-builder transition-colors duration-200 text-sm font-medium text-white cursor-pointer"
                >
                  {item.name}
                </span>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                className="rounded-none bg-transparent text-white hover:text-[#cf8d54] transition-colors duration-200 focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                <Globe className="h-4 w-4" />
              </Button>
              <Button className="login-btn-builder rounded-none transition-colors duration-200">
                Σύνδεση
              </Button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

NavigationSectionComponent.craft = {
  displayName: 'Navigation',
  props: {},
  related: {}
};
