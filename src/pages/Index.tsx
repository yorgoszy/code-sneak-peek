
import { Button } from "@/components/ui/button";
import { ArrowRight, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";

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
      image: "/lovable-uploads/32d7b875-008c-4cca-a559-c707588d97de.png",
      color: "#00ffba"
    },
    {
      id: "02", 
      title: "Movement Development",
      description: "Building athletic foundations for all sports",
      image: "/lovable-uploads/5c575238-ffcf-4f84-aa73-21fa6377ba7d.png",
      color: "#00ffba"
    },
    {
      id: "03",
      title: "Youth Strength", 
      description: "Advanced techniques and conditioning",
      image: "/lovable-uploads/f8f84c19-d969-4da5-a85d-fe764201fc6b.png",
      color: "#00ffba"
    },
    {
      id: "04",
      title: "Fitness",
      description: "Customized fitness solutions for all levels",
      image: "/lovable-uploads/a21faccb-2749-42ef-9686-c8e65fadcc5f.png",
      color: "#00ffba"
    },
    {
      id: "05",
      title: "Muay Thai",
      description: "Next-Gen Training Methods",
      image: "/lovable-uploads/27d8d572-b93f-4f3c-8f89-cc9e10930c87.png",
      color: "#00ffba"
    },
    {
      id: "06",
      title: "One by One Training",
      description: "Personalized coaching for maximum results",
      image: "/lovable-uploads/bff0a31f-54a3-4c49-9e8a-702d714be8d6.png",
      color: "#00ffba"
    },
    {
      id: "07",
      title: "Athlete Performance",
      description: "Elite Strength & Conditioning Strategies",
      image: "/lovable-uploads/a29fcea9-97f7-45a5-8b9f-a0f30b314aa4.png",
      color: "#00ffba"
    }
  ];

  return (
    <div className="min-h-screen bg-white font-robert">
      <style>{`
        .nav-link:hover {
          color: #00ffba !important;
        }
        .dashboard-btn:hover {
          background-color: #00ffba !important;
          border-color: #00ffba !important;
        }
        .logout-btn:hover {
          background-color: #00ffba !important;
          border-color: #00ffba !important;
        }
        .carousel-btn {
          border: none !important;
          background: transparent !important;
        }
        .carousel-btn:hover {
          background: transparent !important;
          border: none !important;
        }
        .carousel-btn:hover svg {
          color: #00ffba !important;
        }
      `}</style>
      
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
                  className="nav-link text-white transition-colors duration-200 text-sm font-medium"
                >
                  {item.name}
                </a>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              {!loading && (
                isAuthenticated ? (
                  <div className="flex items-center space-x-4">
                    <Link to="/dashboard">
                      <Button 
                        variant="outline" 
                        className="dashboard-btn rounded-none bg-transparent border-white text-white hover:text-black transition-colors duration-200"
                      >
                        Dashboard
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      className="logout-btn rounded-none bg-transparent border-white text-white hover:text-black transition-colors duration-200"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" />
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
      <section id="programs" className="py-20 bg-black relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-16">
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                Explore All<br />Programs
              </h2>
            </div>
            {/* Navigation arrows positioned at top right */}
            <div className="flex space-x-4">
              <button 
                className="carousel-btn text-white transition-colors duration-200 h-8 w-8 flex items-center justify-center"
                onClick={() => {
                  const carousel = document.querySelector('[data-carousel="previous"]') as HTMLButtonElement;
                  if (carousel) {
                    carousel.dispatchEvent(new MouseEvent('click', {
                      bubbles: true,
                      cancelable: true,
                      view: window
                    }));
                  }
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button 
                className="carousel-btn text-white transition-colors duration-200 h-8 w-8 flex items-center justify-center"
                onClick={() => {
                  const carousel = document.querySelector('[data-carousel="next"]') as HTMLButtonElement;
                  if (carousel) {
                    carousel.dispatchEvent(new MouseEvent('click', {
                      bubbles: true,
                      cancelable: true,
                      view: window
                    }));
                  }
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {programs.map((program) => (
                <CarouselItem key={program.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/4">
                  <div className="group cursor-pointer flex">
                    {/* Gray outline with number - positioned left of image */}
                    <div 
                      className="w-8 h-64 flex items-start justify-center pt-4 mr-8 relative"
                      style={{ 
                        borderLeft: '2px solid #808080'
                      }}
                    >
                      <span 
                        className="text-2xl font-bold absolute"
                        style={{ 
                          color: program.color,
                          left: '30px',
                          top: '16px'
                        }}
                      >
                        {program.id}
                      </span>
                    </div>
                    
                    {/* Program content */}
                    <div className="flex-1">
                      <div className="relative h-64 mb-6 overflow-hidden">
                        <img
                          src={program.image}
                          alt={program.title}
                          className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-300"
                          style={{ width: '90%', height: '200px' }}
                        />
                        <div className="absolute bottom-4 left-4 right-4">
                          <p className="text-white text-sm mb-2">{program.description}</p>
                        </div>
                      </div>
                      <h3 className="text-white text-xl font-bold mb-2">{program.title}</h3>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious 
              data-carousel="previous"
              className="hidden"
            />
            <CarouselNext 
              data-carousel="next"
              className="hidden"
            />
          </Carousel>
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
