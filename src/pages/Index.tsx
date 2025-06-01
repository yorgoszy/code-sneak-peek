
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#5271ff' }}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50" style={{ backgroundColor: '#5271ff' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img 
                src="/lovable-uploads/a5651e72-baad-4a26-94dd-10b93aa942b9.png" 
                alt="HyperKids Logo" 
                className="h-8 w-auto"
              />
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-white hover:text-gray-200 transition-colors">Αρχική</a>
              <a href="#features" className="text-white hover:text-gray-200 transition-colors">Χαρακτηριστικά</a>
              <a href="#blog" className="text-white hover:text-gray-200 transition-colors">Blog</a>
              <a href="#contact" className="text-white hover:text-gray-200 transition-colors">Επικοινωνία</a>
              
              {!loading && (
                isAuthenticated ? (
                  <div className="flex items-center space-x-4">
                    <Link to="/dashboard">
                      <Button variant="ghost" size="icon" style={{ borderRadius: '0' }} className="text-white hover:bg-white/10">
                        <User className="h-4 w-4" />
                      </Button>
                    </Link>
                    <span className="text-sm text-white">
                      όνομα
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      style={{ borderRadius: '0' }}
                      onClick={handleSignOut}
                      className="text-white hover:bg-white/10"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Link to="/auth">
                    <Button variant="outline" style={{ borderRadius: '0', backgroundColor: 'white', color: '#5271ff' }}>
                      Σύνδεση
                    </Button>
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Index;
