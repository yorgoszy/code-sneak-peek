import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Globe, LogOut, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import hyperkidsLogo from '@/assets/hyperkids-logo.svg';
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
  const [isVisible] = useState(true);

  const handleNavigationClick = (href: string, event: React.MouseEvent) => {
    if (href.startsWith('#')) {
      event.preventDefault();
      const targetId = href.substring(1);
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else {
        console.log(`Element with id "${targetId}" not found`);
      }
    }
  };

  return (
    <nav 
      className={`fixed top-0 w-full bg-black z-50 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <style>{`
        .nav-link:hover {
          color: #cf8d54 !important;
        }
        .dashboard-btn:hover {
          background-color: black !important;
          border-color: transparent !important;
        }
        .logout-btn:hover {
          background-color: black !important;
          border-color: transparent !important;
        }
        .language-btn:hover {
          background-color: black !important;
          border-color: transparent !important;
        }
        .language-btn svg, .dashboard-btn svg, .logout-btn svg {
          color: #ACA097 !important;
        }
        .language-btn:hover svg, .dashboard-btn:hover svg, .logout-btn:hover svg {
          color: #cf8d54 !important;
        }
        .login-btn {
          background-color: #cb8954 !important;
          border-color: #cb8954 !important;
          color: black !important;
        }
        .login-btn:hover {
          background-color: #b87849 !important;
          border-color: #b87849 !important;
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <img 
              src={hyperkidsLogo} 
              alt="HyperKids Logo" 
              className="h-10 w-auto"
            />
          </div>
          
          <div className="hidden lg:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="nav-link transition-colors duration-200 text-sm font-medium"
                style={{ color: '#ACA097' }}
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
