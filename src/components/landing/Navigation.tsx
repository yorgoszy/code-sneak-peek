
import React from 'react';
import { Button } from "@/components/ui/button";
import { Globe, LogOut, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import headerLogo from '@/assets/header-logo.png';

interface NavigationProps {
  navigationItems: Array<{ name: string; href: string }>;
  isAuthenticated: boolean;
  loading: boolean;
  language: 'el' | 'en';
  onToggleLanguage: () => void;
  onSignOut: () => void;
  translations: any;
}

const Navigation: React.FC<NavigationProps> = ({
  navigationItems,
  isAuthenticated,
  loading,
  language,
  onToggleLanguage,
  onSignOut,
  translations
}) => {
  const handleNavigationClick = (href: string, event: React.MouseEvent) => {
    if (href.startsWith('#')) {
      event.preventDefault();
      const targetId = href.substring(1); // Remove the #
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else {
        console.log(`Element with id "${targetId}" not found`);
      }
    }
  };

  return (
    <nav className="fixed top-0 w-full bg-[#f4f1ea] z-50">
      <style>{`
        .nav-link {
          position: relative;
          color: #151514 !important;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: -4px;
          height: 2px;
          width: 100%;
          background-color: #151514;
          transform: scaleX(0);
          transform-origin: right;
          transition: transform 0.3s ease;
        }
        .nav-link:hover::after {
          transform: scaleX(1);
          transform-origin: left;
        }
        .icon-btn {
          position: relative;
        }
        .icon-btn::after {
          content: '';
          position: absolute;
          left: 12px;
          right: 12px;
          bottom: 6px;
          height: 2px;
          background-color: #151514;
          transform: scaleX(0);
          transform-origin: right;
          transition: transform 0.3s ease;
        }
        .icon-btn:hover::after {
          transform: scaleX(1);
          transform-origin: left;
        }
        .icon-btn:hover {
          background-color: transparent !important;
          color: #151514 !important;
        }
        .icon-btn svg {
          color: #151514 !important;
        }
        .login-btn {
          background-color: #151514 !important;
          border-color: #151514 !important;
          color: #f4f1ea !important;
        }
        .login-btn:hover {
          background-color: #2a2a28 !important;
          border-color: #2a2a28 !important;
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <img 
              src={headerLogo} 
              alt="HyperKids Logo" 
              className="h-10 w-auto brightness-0"
            />
          </div>
          
          <div className="hidden lg:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="nav-link transition-colors duration-200 text-sm font-medium text-[#151514]"
                onClick={(e) => handleNavigationClick(item.href, e)}
              >
                {item.name}
              </a>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            {!loading && (
              isAuthenticated ? (
                <div className="flex items-center space-x-0">
                  <Button 
                    variant="ghost" 
                    className="icon-btn rounded-none bg-transparent text-[#151514] transition-colors duration-200 focus-visible:ring-0 focus-visible:ring-offset-0"
                    onClick={onToggleLanguage}
                  >
                    <Globe className="h-4 w-4" />
                  </Button>
                  <Link to="/dashboard">
                    <Button 
                      variant="ghost" 
                      className="icon-btn rounded-none bg-transparent text-[#151514] transition-colors duration-200 focus-visible:ring-0 focus-visible:ring-offset-0"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    className="icon-btn rounded-none bg-transparent text-[#151514] transition-colors duration-200 focus-visible:ring-0 focus-visible:ring-offset-0"
                    onClick={onSignOut}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="ghost" 
                    className="icon-btn rounded-none bg-transparent text-[#151514] transition-colors duration-200 focus-visible:ring-0 focus-visible:ring-offset-0"
                    onClick={onToggleLanguage}
                  >
                    <Globe className="h-4 w-4" />
                  </Button>
                  <Link to={`/auth?lang=${language}`}>
                    <Button className="login-btn rounded-none transition-colors duration-200">
                      {translations.login}
                    </Button>
                  </Link>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
