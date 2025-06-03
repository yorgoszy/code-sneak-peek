
import { Button } from "@/components/ui/button";
import { ArrowRight, LogOut } from "lucide-react";
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
    <div className="min-h-screen bg-white font-robert">
      {/* Black Navigation */}
      <nav className="fixed top-0 w-full bg-black border-b border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-white">HyperKids</span>
            </div>
            <div className="flex items-center space-x-8">
              {!loading && (
                isAuthenticated ? (
                  <div className="flex items-center space-x-4">
                    <Link to="/dashboard">
                      <Button variant="outline" className="rounded-none bg-transparent border-white text-white hover:bg-white hover:text-black">
                        Dashboard
                      </Button>
                    </Link>
                    <span className="text-sm text-gray-300">
                      {user?.email}
                    </span>
                    <Button 
                      variant="outline" 
                      className="rounded-none bg-transparent border-white text-white hover:bg-white hover:text-black"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Αποσύνδεση
                    </Button>
                  </div>
                ) : (
                  <Link to="/auth">
                    <Button variant="outline" className="rounded-none bg-transparent border-white text-white hover:bg-white hover:text-black">
                      Σύνδεση
                    </Button>
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 min-h-screen flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/lovable-uploads/7d78ce26-3ce9-488f-9948-1cb90eac5b9e.png')`
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            HyperKids
          </h1>
          <p className="text-lg sm:text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Η πλατφόρμα που μεταμορφώνει την εκπαίδευση των παιδιών σας
          </p>
          <div className="flex justify-center space-x-4">
            <Button 
              className="rounded-none bg-white text-black hover:bg-gray-100" 
              onClick={handleGetStarted}
            >
              {isAuthenticated ? "Πήγαινε στο Dashboard" : "Ξεκινήστε τώρα"} <ArrowRight className="ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
