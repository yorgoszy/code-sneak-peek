import React from 'react';
import { Button } from "@/components/ui/button";
import { Globe, LogOut, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";

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
    <nav className="fixed top-0 w-full bg-black z-50">
      <style>{`
        .nav-link:hover {
          color: #00ffba !important;
        }
        .dashboard-btn:hover {
          background-color: #00ffba !important;
          border-color: transparent !important;
        }
        .logout-btn:hover {
          background-color: #00ffba !important;
          border-color: transparent !important;
        }
        .language-btn:hover {
          background-color: #00ffba !important;
          border-color: transparent !important;
        }
        .login-btn {
          background-color: #00ffba !important;
          border-color: #00ffba !important;
          color: black !important;
        }
        .login-btn:hover {
          background-color: #00cc99 !important;
          border-color: #00cc99 !important;
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/e6f77be6-7f24-4357-88b6-55d1fec4139d.png" 
              alt="HyperKids Logo" 
              className="h-10 w-auto"
            />
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="nav-link text-white transition-colors duration-200 text-sm font-medium"
                onClick={(e) => handleNavigationClick(item.href, e)}
              >
                {item.name}
              </a>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            {!loading && (
              isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="ghost" 
                    className="language-btn rounded-none bg-transparent text-white hover:text-black transition-colors duration-200 focus-visible:ring-0 focus-visible:ring-offset-0"
                    onClick={onToggleLanguage}
                  >
                    <Globe className="h-4 w-4" />
                  </Button>
                  <Link to="/dashboard">
                    <Button 
                      variant="ghost" 
                      className="dashboard-btn rounded-none bg-transparent text-white hover:text-black transition-colors duration-200 focus-visible:ring-0 focus-visible:ring-offset-0"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    className="logout-btn rounded-none bg-transparent text-white hover:text-black transition-colors duration-200 focus-visible:ring-0 focus-visible:ring-offset-0"
                    onClick={onSignOut}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="ghost" 
                    className="language-btn rounded-none bg-transparent text-white hover:text-black transition-colors duration-200 focus-visible:ring-0 focus-visible:ring-offset-0"
                    onClick={onToggleLanguage}
                  >
                    <Globe className="h-4 w-4" />
                  </Button>
                  <Link to="/auth">
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
