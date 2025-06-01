
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
      {/* Animated Background Elements */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative">
          {/* Main logo with pulse animation */}
          <img 
            src="/lovable-uploads/a5651e72-baad-4a26-94dd-10b93aa942b9.png" 
            alt="HyperKids Background Logo" 
            className="h-96 w-auto opacity-10 animate-pulse"
          />
          
          {/* Floating geometric shapes from uploaded images */}
          <img 
            src="/lovable-uploads/ec22b41e-e622-40e5-92b9-18ade9c2742f.png" 
            alt="Floating Shape 1" 
            className="absolute -top-32 -left-40 h-32 w-auto opacity-15 animate-[float_8s_ease-in-out_infinite]"
          />
          <img 
            src="/lovable-uploads/7bc134c9-d639-4909-95ce-155fed5ffedc.png" 
            alt="Floating Shape 2" 
            className="absolute -bottom-24 -right-32 h-40 w-auto opacity-20 animate-[float_12s_ease-in-out_infinite_reverse] rotate-45"
          />
          <img 
            src="/lovable-uploads/ec22b41e-e622-40e5-92b9-18ade9c2742f.png" 
            alt="Floating Shape 3" 
            className="absolute top-16 -right-20 h-24 w-auto opacity-10 animate-[float_6s_ease-in-out_infinite] rotate-12"
          />
          <img 
            src="/lovable-uploads/7bc134c9-d639-4909-95ce-155fed5ffedc.png" 
            alt="Floating Shape 4" 
            className="absolute -top-10 left-20 h-28 w-auto opacity-15 animate-[float_10s_ease-in-out_infinite] -rotate-30"
          />
          
          {/* Additional floating logos */}
          <img 
            src="/lovable-uploads/a5651e72-baad-4a26-94dd-10b93aa942b9.png" 
            alt="Floating Logo 1" 
            className="absolute top-32 -left-24 h-20 w-auto opacity-5 animate-[float_7s_ease-in-out_infinite]"
          />
          <img 
            src="/lovable-uploads/a5651e72-baad-4a26-94dd-10b93aa942b9.png" 
            alt="Floating Logo 2" 
            className="absolute -bottom-8 left-16 h-16 w-auto opacity-8 animate-[float_9s_ease-in-out_infinite_reverse]"
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
          <h1 className="text-6xl font-bold mb-4 animate-fade-in">HyperKids</h1>
          <p className="text-xl mb-8 animate-fade-in animation-delay-200">
            Το μέλλον της παιδικής φυσικής κατάστασης
          </p>
          <Button 
            onClick={handleGetStarted}
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg animate-fade-in animation-delay-400"
            style={{ borderRadius: '0' }}
          >
            {isAuthenticated ? "Πηγαίνετε στο Dashboard" : "Ξεκινήστε τώρα"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
