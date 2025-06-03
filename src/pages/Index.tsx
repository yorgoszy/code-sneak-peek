
import { Button } from "@/components/ui/button";
import { ArrowRight, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
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

  const programs = [
    {
      id: "01",
      title: "Movement Learning",
      description: "Introductory movement techniques",
      image: "/lovable-uploads/29ceb456-3fe1-4f11-82f7-f66e683312bb.png",
      color: "#00ffba"
    },
    {
      id: "02", 
      title: "Movement Development",
      description: "Building athletic foundations for all sports",
      image: "/lovable-uploads/62fc768d-b98f-4885-96a1-5840c86bfc39.png",
      color: "#00ffba"
    },
    {
      id: "03",
      title: "Youth Strength", 
      description: "Advanced techniques and conditioning",
      image: "/lovable-uploads/81100ffe-6e78-4faa-a6f7-46163c4fdc57.png",
      color: "#00ffba"
    },
    {
      id: "04",
      title: "Fitness",
      description: "Customized fitness solutions for all levels",
      image: "/lovable-uploads/97800d53-e9d6-4b5d-876a-69015555d90b.png",
      color: "#00ffba"
    }
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
      <section id="home" className="relative pt-16 min-h-screen flex items-center">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/lovable-uploads/7d78ce26-3ce9-488f-9948-1cb90eac5b9e.png')`
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              The Champion's Journey<br />
              <span style={{ color: '#00ffba' }}>Starts Here</span>
            </h1>
            <div className="flex space-x-4">
              <Button 
                className="rounded-none text-black hover:bg-gray-100" 
                style={{ backgroundColor: '#00ffba' }}
                onClick={handleGetStarted}
              >
                GET STARTED
              </Button>
              <Button 
                variant="outline" 
                className="rounded-none bg-transparent border-white text-white hover:bg-white hover:text-black"
              >
                CONTACT
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-16">
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                Explore All<br />Programs
              </h2>
            </div>
            <div className="flex space-x-4">
              <Button
                variant="outline"
                size="icon"
                className="rounded-none bg-transparent border-white text-white hover:bg-white hover:text-black"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-none bg-transparent border-white text-white hover:bg-white hover:text-black"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {programs.map((program) => (
              <div key={program.id} className="group cursor-pointer">
                <div className="relative h-80 mb-6 overflow-hidden">
                  <img
                    src={program.image}
                    alt={program.title}
                    className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <span 
                      className="text-2xl font-bold"
                      style={{ color: program.color }}
                    >
                      {program.id}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white text-sm mb-2">{program.description}</p>
                  </div>
                </div>
                <h3 className="text-white text-xl font-bold mb-2">{program.title}</h3>
              </div>
            ))}
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
