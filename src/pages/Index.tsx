

import { Button } from "@/components/ui/button";
import { ArrowRight, LogOut, ChevronLeft, ChevronRight, Globe } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { useState } from "react";

const Index = () => {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [language, setLanguage] = useState<'el' | 'en'>('el');

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

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'el' ? 'en' : 'el');
  };

  const translations = {
    el: {
      home: "Αρχική",
      programs: "Προγράμματα",
      blog: "Blog",
      about: "Σχετικά με εμάς",
      results: "Αποτελέσματα",
      contact: "Επικοινωνία",
      login: "Σύνδεση",
      dashboard: "Dashboard",
      getStarted: "ΞΕΚΙΝΑ ΤΩΡΑ",
      contactBtn: "ΕΠΙΚΟΙΝΩΝΙΑ",
      heroTitle: "Το Ταξίδι του Πρωταθλητή",
      heroSubtitle: "Ξεκινάει Εδώ",
      explorePrograms: "Εξερεύνηση Όλων των Προγραμμάτων",
      blogSection: "Blog",
      blogDescription: "Διαβάστε τα τελευταία άρθρα και συμβουλές από τους ειδικούς μας",
      aboutSection: "Σχετικά με εμάς",
      aboutDescription: "Μάθετε περισσότερα για την ομάδα μας και την αποστολή μας",
      resultsSection: "Αποτελέσματα",
      resultsDescription: "Δείτε τα εντυπωσιακά αποτελέσματα των συμμετεχόντων μας",
      contactSection: "Επικοινωνία",
      contactDescription: "Επικοινωνήστε μαζί μας για περισσότερες πληροφορίες",
      copyright: "© 2024 HyperKids. Όλα τα δικαιώματα διατηρούνται.",
      movementLearning: "Εκμάθηση Κίνησης",
      movementLearningDesc: "Εισαγωγικές τεχνικές κίνησης",
      movementDevelopment: "Ανάπτυξη Κίνησης",
      movementDevelopmentDesc: "Χτίζοντας αθλητικές βάσεις για όλα τα σπορ",
      youthStrength: "Δύναμη Νέων",
      youthStrengthDesc: "Προχωρημένες τεχνικές και φυσική κατάσταση",
      fitness: "Φυσική Κατάσταση",
      fitnessDesc: "Προσαρμοσμένες λύσεις φυσικής κατάστασης για όλα τα επίπεδα",
      muayThai: "Muay Thai",
      muayThaiDesc: "Μέθοδοι Προπόνησης Νέας Γενιάς",
      oneByOne: "Προπόνηση Ένας προς Έναν",
      oneByOneDesc: "Εξατομικευμένη προπονητική για μέγιστα αποτελέσματα",
      athletePerformance: "Αθλητική Απόδοση",
      athletePerformanceDesc: "Ελίτ Στρατηγικές Δύναμης & Φυσικής Κατάστασης"
    },
    en: {
      home: "Home",
      programs: "Programs",
      blog: "Blog",
      about: "About Us",
      results: "Results",
      contact: "Contact",
      login: "Login",
      dashboard: "Dashboard",
      getStarted: "GET STARTED",
      contactBtn: "CONTACT",
      heroTitle: "The Champion's Journey",
      heroSubtitle: "Starts Here",
      explorePrograms: "Explore All Programs",
      blogSection: "Blog",
      blogDescription: "Read the latest articles and tips from our experts",
      aboutSection: "About Us",
      aboutDescription: "Learn more about our team and mission",
      resultsSection: "Results",
      resultsDescription: "See the impressive results of our participants",
      contactSection: "Contact",
      contactDescription: "Contact us for more information",
      copyright: "© 2024 HyperKids. All rights reserved.",
      movementLearning: "Movement Learning",
      movementLearningDesc: "Introductory movement techniques",
      movementDevelopment: "Movement Development",
      movementDevelopmentDesc: "Building athletic foundations for all sports",
      youthStrength: "Youth Strength",
      youthStrengthDesc: "Advanced techniques and conditioning",
      fitness: "Fitness",
      fitnessDesc: "Customized fitness solutions for all levels",
      muayThai: "Muay Thai",
      muayThaiDesc: "Next-Gen Training Methods",
      oneByOne: "One by One Training",
      oneByOneDesc: "Personalized coaching for maximum results",
      athletePerformance: "Athlete Performance",
      athletePerformanceDesc: "Elite Strength & Conditioning Strategies"
    }
  };

  const t = translations[language];

  const navigationItems = [
    { name: t.home, href: "#home" },
    { name: t.programs, href: "#programs" },
    { name: t.blog, href: "#blog" },
    { name: t.about, href: "#about" },
    { name: t.results, href: "#results" },
    { name: t.contact, href: "#contact" }
  ];

  const programs = [
    {
      id: "01",
      title: t.movementLearning,
      description: t.movementLearningDesc,
      image: "/lovable-uploads/32d7b875-008c-4cca-a559-c707588d97de.png",
      color: "#00ffba"
    },
    {
      id: "02", 
      title: t.movementDevelopment,
      description: t.movementDevelopmentDesc,
      image: "/lovable-uploads/5c575238-ffcf-4f84-aa73-21fa6377ba7d.png",
      color: "#00ffba"
    },
    {
      id: "03",
      title: t.youthStrength, 
      description: t.youthStrengthDesc,
      image: "/lovable-uploads/f8f84c19-d969-4da5-a85d-fe764201fc6b.png",
      color: "#00ffba"
    },
    {
      id: "04",
      title: t.fitness,
      description: t.fitnessDesc,
      image: "/lovable-uploads/a21faccb-2749-42ef-9686-c8e65fadcc5f.png",
      color: "#00ffba"
    },
    {
      id: "05",
      title: t.muayThai,
      description: t.muayThaiDesc,
      image: "/lovable-uploads/27d8d572-b93f-4f3c-8f89-cc9e10930c87.png",
      color: "#00ffba"
    },
    {
      id: "06",
      title: t.oneByOne,
      description: t.oneByOneDesc,
      image: "/lovable-uploads/bff0a31f-54a3-4c49-9e8a-702d714be8d6.png",
      color: "#00ffba"
    },
    {
      id: "07",
      title: t.athletePerformance,
      description: t.athletePerformanceDesc,
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
        .language-btn:hover {
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
                      className="language-btn rounded-none bg-transparent border-white text-white hover:text-black transition-colors duration-200"
                      onClick={toggleLanguage}
                    >
                      <Globe className="h-4 w-4 mr-1" />
                      {language === 'el' ? 'EN' : 'ΕΛ'}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="logout-btn rounded-none bg-transparent border-white text-white hover:text-black transition-colors duration-200"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <Link to="/auth">
                      <Button variant="outline" className="rounded-none bg-transparent border-white text-white hover:bg-white hover:text-black">
                        {t.login}
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      className="language-btn rounded-none bg-transparent border-white text-white hover:text-black transition-colors duration-200"
                      onClick={toggleLanguage}
                    >
                      <Globe className="h-4 w-4 mr-1" />
                      {language === 'el' ? 'EN' : 'ΕΛ'}
                    </Button>
                  </div>
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
              {t.heroTitle}<br />
              <span style={{ color: '#00ffba' }}>{t.heroSubtitle}</span>
            </h1>
            <div className="flex space-x-4">
              <Button 
                className="rounded-none text-black hover:bg-gray-100" 
                style={{ backgroundColor: '#00ffba' }}
                onClick={handleGetStarted}
              >
                {t.getStarted}
              </Button>
              <Button 
                variant="outline" 
                className="rounded-none bg-transparent border-white text-white hover:bg-white hover:text-black"
              >
                {t.contactBtn}
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
                {t.explorePrograms}
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
                  <div className="group cursor-pointer">
                    {/* Program number positioned directly above image */}
                    <div className="flex justify-start mb-2">
                      <span 
                        className="text-3xl font-bold"
                        style={{ color: program.color }}
                      >
                        {program.id}
                      </span>
                    </div>
                    
                    {/* Program content with gray outline */}
                    <div 
                      className="border-l-2 border-gray-500 pl-6"
                    >
                      <div className="relative h-64 mb-6 overflow-hidden">
                        <img
                          src={program.image}
                          alt={program.title}
                          className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-300"
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.blogSection}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t.blogDescription}
            </p>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.aboutSection}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t.aboutDescription}
            </p>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section id="results" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.resultsSection}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t.resultsDescription}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.contactSection}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t.contactDescription}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">{t.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
