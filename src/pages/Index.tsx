
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
      {/* Falling Shapes Background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Shape 1 */}
        <div className="absolute animate-shape-fall-1" style={{ left: '10%', animationDelay: '0s' }}>
          <img 
            src="/lovable-uploads/eb612ce9-ca13-44cc-b798-61bda46cebca.png" 
            alt=""
            className="w-12 h-12 opacity-80"
          />
        </div>
        {/* Shape 2 */}
        <div className="absolute animate-shape-fall-2" style={{ left: '25%', animationDelay: '1s' }}>
          <img 
            src="/lovable-uploads/eb612ce9-ca13-44cc-b798-61bda46cebca.png" 
            alt=""
            className="w-8 h-8 opacity-60"
          />
        </div>
        {/* Shape 3 */}
        <div className="absolute animate-shape-fall-3" style={{ left: '45%', animationDelay: '2s' }}>
          <img 
            src="/lovable-uploads/eb612ce9-ca13-44cc-b798-61bda46cebca.png" 
            alt=""
            className="w-16 h-16 opacity-70"
          />
        </div>
        {/* Shape 4 */}
        <div className="absolute animate-shape-fall-1" style={{ left: '65%', animationDelay: '0.5s' }}>
          <img 
            src="/lovable-uploads/eb612ce9-ca13-44cc-b798-61bda46cebca.png" 
            alt=""
            className="w-10 h-10 opacity-50"
          />
        </div>
        {/* Shape 5 */}
        <div className="absolute animate-shape-fall-2" style={{ left: '80%', animationDelay: '1.5s' }}>
          <img 
            src="/lovable-uploads/eb612ce9-ca13-44cc-b798-61bda46cebca.png" 
            alt=""
            className="w-14 h-14 opacity-65"
          />
        </div>
        {/* Shape 6 */}
        <div className="absolute animate-shape-fall-3" style={{ left: '5%', animationDelay: '3s' }}>
          <img 
            src="/lovable-uploads/eb612ce9-ca13-44cc-b798-61bda46cebca.png" 
            alt=""
            className="w-6 h-6 opacity-40"
          />
        </div>
        {/* Shape 7 */}
        <div className="absolute animate-shape-fall-1" style={{ left: '35%', animationDelay: '2.5s' }}>
          <img 
            src="/lovable-uploads/eb612ce9-ca13-44cc-b798-61bda46cebca.png" 
            alt=""
            className="w-12 h-12 opacity-75"
          />
        </div>
        {/* Shape 8 */}
        <div className="absolute animate-shape-fall-2" style={{ left: '55%', animationDelay: '3.5s' }}>
          <img 
            src="/lovable-uploads/eb612ce9-ca13-44cc-b798-61bda46cebca.png" 
            alt=""
            className="w-10 h-10 opacity-55"
          />
        </div>
        {/* Shape 9 */}
        <div className="absolute animate-shape-fall-3" style={{ left: '75%', animationDelay: '4s' }}>
          <img 
            src="/lovable-uploads/eb612ce9-ca13-44cc-b798-61bda46cebca.png" 
            alt=""
            className="w-8 h-8 opacity-45"
          />
        </div>
        {/* Shape 10 */}
        <div className="absolute animate-shape-fall-1" style={{ left: '90%', animationDelay: '4.5s' }}>
          <img 
            src="/lovable-uploads/eb612ce9-ca13-44cc-b798-61bda46cebca.png" 
            alt=""
            className="w-14 h-14 opacity-70"
          />
        </div>
      </div>

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
        </div>
      </div>
    </div>
  );
};

export default Index;
