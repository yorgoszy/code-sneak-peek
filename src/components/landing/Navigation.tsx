
import React from 'react';
import { Button } from "@/components/ui/button";
import { Globe, LogOut, LayoutDashboard, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import headerLogo from '@/assets/header-logo.png';
import { useLandingSection } from '@/hooks/useLandingConfig';
import { getSectionStyleVars } from './sectionStyle';
import { getLucideIcon } from '@/components/landing-cms/LucideIconPicker';


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
  const navSection = useLandingSection('navigation');
  const [liveDraft, setLiveDraft] = React.useState<{ extra?: any; image_url?: string | null } | null>(null);

  React.useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (!d || d.type !== 'landing-editor-draft' || d.sectionKey !== 'navigation') return;
      setLiveDraft({ extra: d.extra ?? {}, image_url: d.image_url ?? null });
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const overrides = getSectionStyleVars(navSection);
  const extra: any = { ...(navSection?.extra_data ?? {}), ...(liveDraft?.extra ?? {}) };
  const liveImageUrl = liveDraft?.image_url ?? navSection?.image_url;
  const logoUrl: string = extra.logo_url || liveImageUrl || headerLogo;
  const LangIcon = getLucideIcon(extra.lang_icon) ?? Globe;
  const DashIcon = getLucideIcon(extra.dashboard_icon) ?? LayoutDashboard;
  const LogoutIcon = getLucideIcon(extra.logout_icon) ?? LogOut;
  const LoginIcon = getLucideIcon(extra.login_icon) ?? LogIn;
  const showLoginIcon: boolean = !!extra.login_icon;


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
      className="fixed top-0 w-full z-50"
      style={{ backgroundColor: 'var(--landing-nav-bg, #ffffff)', ...overrides }}
    >
      <style>{`
        .nav-link {
          position: relative;
          color: var(--landing-nav-text, #151514) !important;
          font-family: var(--landing-font-body, inherit);
          transition: color 0.2s ease;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: -4px;
          height: 2px;
          width: 100%;
          background-color: var(--landing-nav-hover, #151514);
          transform: scaleX(0);
          transform-origin: right;
          transition: transform 0.3s ease;
        }
        .nav-link:hover {
          color: var(--landing-nav-hover, #151514) !important;
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
          background-color: var(--landing-nav-hover, #151514);
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
          color: var(--landing-nav-hover, #151514) !important;
        }
        .icon-btn:hover svg {
          color: var(--landing-nav-hover, #151514) !important;
        }
        .icon-btn svg {
          color: var(--landing-nav-icon, #151514) !important;
          transition: color 0.2s ease;
        }
        .login-btn {
          background-color: var(--landing-btn-bg, #151514) !important;
          border-color: var(--landing-btn-bg, #151514) !important;
          color: var(--landing-btn-text, #f4f1ea) !important;
          transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
        }
        .login-btn:hover {
          background-color: var(--landing-btn-hover-bg, #2a2a28) !important;
          border-color: var(--landing-btn-hover-bg, #2a2a28) !important;
          color: var(--landing-btn-hover-text, #ffffff) !important;
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <img 
              src={logoUrl} 
              alt="Logo" 
              className="h-10 w-auto"
              style={extra.logo_url || navSection?.image_url ? undefined : { filter: 'brightness(0)' }}
            />
          </div>
          
          <div className="hidden lg:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="nav-link text-sm font-medium"
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
                    className="icon-btn rounded-none bg-transparent transition-colors duration-200 focus-visible:ring-0 focus-visible:ring-offset-0"
                    onClick={onToggleLanguage}
                  >
                    <LangIcon className="h-4 w-4" />
                  </Button>
                  <Link to="/dashboard">
                    <Button 
                      variant="ghost" 
                      className="icon-btn rounded-none bg-transparent transition-colors duration-200 focus-visible:ring-0 focus-visible:ring-offset-0"
                    >
                      <DashIcon className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    className="icon-btn rounded-none bg-transparent transition-colors duration-200 focus-visible:ring-0 focus-visible:ring-offset-0"
                    onClick={onSignOut}
                  >
                    <LogoutIcon className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="ghost" 
                    className="icon-btn rounded-none bg-transparent transition-colors duration-200 focus-visible:ring-0 focus-visible:ring-offset-0"
                    onClick={onToggleLanguage}
                  >
                    <LangIcon className="h-4 w-4" />
                  </Button>
                  <Link to={`/auth?lang=${language}`}>
                    <Button className="login-btn rounded-none">
                      {showLoginIcon && <LoginIcon className="h-4 w-4 mr-2" />}
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
