
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

  const navigationItems = [
    { name: "Home", href: "#home" },
    { name: "Programs", href: "#programs" },
    { name: "Blog", href: "#blog" },
    { name: "About Us", href: "#about" },
    { name: "Results", href: "#results" },
    { name: "Contact", href: "#contact" }
  ];

  return (
    <div className="min-h-screen bg-white font-robert">
      {/* Black Navigation */}
      <nav className="fixed top-0 w-full bg-black border-b border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/e6f77be6-7f24-4357-88b6-55d1fec4139d.png" 
                alt="HyperKids Logo" 
                className="h-10 w-auto"
              />
            </div>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-white hover:text-gray-300 transition-colors duration-200 text-sm font-medium"
                >
                  {item.name}
                </a>
              ))}
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
      <section id="home" className="relative pt-16 min-h-screen flex items-center justify-center">
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

      {/* Programs Section */}
      <section id="programs" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Τα Προγράμματά μας</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Ανακαλύψτε τα εξειδικευμένα προγράμματα που προσφέρουμε για την ανάπτυξη των παιδιών σας
            </p>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Blog</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Διαβάστε τα τελευταία άρθρα και συμβουλές από τους ειδικούς μας
            </p>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Σχετικά με εμάς</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Μάθετε περισσότερα για την ομάδα μας και την αποστολή μας
            </p>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section id="results" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Αποτελέσματα</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Δείτε τα εντυπωσιακά αποτελέσματα των συμμετεχόντων μας
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Επικοινωνία</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Επικοινωνήστε μαζί μας για περισσότερες πληροφορίες
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">© 2024 HyperKids. Όλα τα δικαιώματα διατηρούνται.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
