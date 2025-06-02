
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
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#5271ff' }}>
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
              <a href="#home" className="text-white hover:text-gray-200 transition-colors">Home</a>
              <a href="#programs" className="text-white hover:text-gray-200 transition-colors">Programs</a>
              <a href="#blog" className="text-white hover:text-gray-200 transition-colors">Blog</a>
              <a href="#about" className="text-white hover:text-gray-200 transition-colors">About Us</a>
              <a href="#results" className="text-white hover:text-gray-200 transition-colors">Results</a>
              <a href="#contact" className="text-white hover:text-gray-200 transition-colors">Contact Us</a>
              
              {!loading && (
                isAuthenticated ? (
                  <div className="flex items-center space-x-2">
                    <Link to="/dashboard">
                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" style={{ borderRadius: '0' }}>
                        <User className="h-4 w-4" />
                      </Button>
                    </Link>
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

      {/* Hero Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-center text-white px-4">
          <h1 className="text-6xl font-bold mb-4 animate-fade-in">
            The Champion's Journey
            <br />
            <span className="text-left block">Starts Here</span>
          </h1>
        </div>
      </div>
    </div>
  );
};

export default Index;
