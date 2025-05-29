
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Menu, X, User, Globe, ChevronLeft, ChevronRight } from "lucide-react";

const Index = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentProgram, setCurrentProgram] = useState(0);

  const programs = [
    {
      id: "01",
      title: "Εκμάθηση Κίνησης",
      description: "Εισαγωγικές τεχνικές κίνησης",
      image: "/lovable-uploads/12fd681e-290f-4ce8-a035-32501adf2034.png"
    },
    {
      id: "02", 
      title: "Ανάπτυξη Κίνησης",
      description: "Δημιουργία αθλητικών βάσεων για όλα τα αθλήματα",
      image: "/lovable-uploads/9d74fc2b-b9ee-4272-9a0e-9f5a3d7d29f4.png"
    },
    {
      id: "03",
      title: "Δύναμη Νέων", 
      description: "Προπτωμένες τεχνικές και φυσική κατάσταση",
      image: "/lovable-uploads/29ceb456-3fe1-4f11-82f7-f66e683312bb.png"
    },
    {
      id: "04",
      title: "Φυσική Κατάσταση",
      description: "Εξατομικευμένες λύσεις φυσικής κατάστασης για όλα τα επίπεδα",
      image: "/lovable-uploads/100152b9-0727-459b-b2b6-e6614fe8c730.png"
    },
    {
      id: "05",
      title: "Muay Thai",
      description: "Μέθοδοι Προπόνησης Νέων Γενιές",
      image: "/lovable-uploads/59a5eb9c-a6d9-4195-bc4c-bee6f5ce513c.png"
    },
    {
      id: "06",
      title: "Ατομική Προπόνηση",
      description: "Εξατομικευμένη καθοδήγηση για μέγιστα αποτελέσματα",
      image: "/lovable-uploads/85436038-48ee-42f9-a2e6-d13a75dd8d52.png"
    },
    {
      id: "07",
      title: "Αθλητική Απόδοση",
      description: "Στρατηγικές Ελίτ Δύναμης & Φυσικής Κατάστασης",
      image: "/lovable-uploads/77591c7f-20d5-4ab2-ab03-5ae09f70daf5.png"
    }
  ];

  const nextProgram = () => {
    setCurrentProgram((prev) => (prev + 1) % programs.length);
  };

  const prevProgram = () => {
    setCurrentProgram((prev) => (prev - 1 + programs.length) % programs.length);
  };

  return (
    <div className="min-h-screen bg-black text-white font-robert font-medium">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-black/95 backdrop-blur-sm z-50 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img 
                  src="/lovable-uploads/83e3ba31-3c4d-44a1-b842-c9468896e822.png" 
                  alt="HYPERKIDS Logo" 
                  className="h-8 w-auto"
                />
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#home" className="text-white hover:text-[#00ffba] text-sm font-medium transition-colors">
                  Αρχή
                </a>
                <a href="#programs" className="text-white hover:text-[#00ffba] text-sm font-medium transition-colors">
                  Προγράμματα
                </a>
                <a href="#schedule" className="text-white hover:text-[#00ffba] text-sm font-medium transition-colors">
                  Σχετικά Με Εμάς
                </a>
                <a href="#results" className="text-white hover:text-[#00ffba] text-sm font-medium transition-colors">
                  Αποτελέσματα
                </a>
                <a href="#contact" className="text-white hover:text-[#00ffba] text-sm font-medium transition-colors">
                  Επικοινωνία
                </a>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Globe className="h-6 w-6 text-white hover:text-[#00ffba] cursor-pointer transition-colors" />
              <User className="h-6 w-6 text-white hover:text-[#00ffba] cursor-pointer transition-colors" />
            </div>
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white"
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 bg-black/95 backdrop-blur-sm border-b border-gray-800 z-40">
          <div className="px-4 py-4 space-y-3">
            <a href="#home" className="block text-white hover:text-[#00ffba] text-sm font-medium">
              Αρχή
            </a>
            <a href="#programs" className="block text-white hover:text-[#00ffba] text-sm font-medium">
              Προγράμματα
            </a>
            <a href="#schedule" className="block text-white hover:text-[#00ffba] text-sm font-medium">
              Σχετικά Με Εμάς
            </a>
            <a href="#results" className="block text-white hover:text-[#00ffba] text-sm font-medium">
              Αποτελέσματα
            </a>
            <a href="#contact" className="block text-white hover:text-[#00ffba] text-sm font-medium">
              Επικοινωνία
            </a>
            <div className="pt-4 flex justify-center space-x-4">
              <Globe className="h-6 w-6 text-white hover:text-[#00ffba] cursor-pointer transition-colors" />
              <User className="h-6 w-6 text-white hover:text-[#00ffba] cursor-pointer transition-colors" />
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-end pb-32">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/lovable-uploads/b0c1fb65-ea62-4a1d-8cae-3ce536633f96.png')`,
          }}
        >
          <div className="absolute inset-0 bg-black/60"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 text-left px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight font-robert">
            The Champion's Journey
            <br />
            <span style={{ color: '#00ffba' }}>
              Starts Here
            </span>
          </h1>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Button size="lg" className="text-lg px-8 py-4 bg-[#00ffba] hover:bg-[#00e6a8] text-black rounded-none font-roobert-pro-light font-light">
              GET STARTED
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4 border-white text-white bg-transparent hover:bg-white/10 rounded-none font-roobert-pro-light font-light">
              CONTACT
            </Button>
          </div>
        </div>
        
        {/* Scroll Down Indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="text-center flex flex-col items-center">
            <div className="text-sm text-gray-300 mb-2">SCROLL DOWN</div>
            <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-bounce"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-left mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-roobert-pro-light">
              Εξερεύνησε Όλα Τα
              <br />
              Προγράμματα
            </h2>
          </div>
          
          <div className="relative">
            {/* Program Numbers Navigation */}
            <div className="flex gap-8 mb-12">
              {programs.map((program, index) => (
                <button
                  key={program.id}
                  onClick={() => setCurrentProgram(index)}
                  className={`text-left transition-colors ${
                    currentProgram === index ? 'text-[#00ffba]' : 'text-gray-500'
                  }`}
                >
                  <div className="text-lg font-bold mb-2">{program.id}</div>
                  <div className="text-sm font-roobert-pro-light">{program.title}</div>
                </button>
              ))}
            </div>

            {/* Carousel Navigation Arrows */}
            <div className="absolute top-0 right-0 flex gap-4">
              <button
                onClick={prevProgram}
                className="w-12 h-12 border border-gray-600 rounded-none flex items-center justify-center hover:border-[#00ffba] transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextProgram}
                className="w-12 h-12 border border-gray-600 rounded-none flex items-center justify-center hover:border-[#00ffba] transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Program Images Grid */}
            <div className="grid grid-cols-4 gap-6 h-96">
              {programs.map((program, index) => (
                <div 
                  key={program.id}
                  className={`relative overflow-hidden transition-all duration-500 ${
                    currentProgram === index ? 'col-span-2' : 'col-span-1'
                  }`}
                >
                  <img
                    src={program.image}
                    alt={program.title}
                    className="w-full h-full object-cover filter grayscale"
                  />
                  <div className="absolute inset-0 bg-black/60"></div>
                  {currentProgram === index && (
                    <div className="absolute bottom-6 left-6 text-white">
                      <p className="text-sm font-roobert-pro-light">{program.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="schedule" className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Side - Content */}
            <div>
              <div className="text-[#00ffba] text-sm font-medium mb-4 tracking-wider">ΣΧΕΤΙΚΑ ΜΕ ΕΜΑΣ</div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
                Supporting Your
                <br />
                <span className="text-[#00ffba]">Athletic Journey</span>
              </h2>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="text-[#00ffba] font-bold text-xl">01</div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-2">Κύριος Προπονητής</h3>
                    <div className="w-16 h-0.5 bg-[#00ffba] mb-3"></div>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="text-gray-500 font-bold text-xl">02</div>
                  <div>
                    <h3 className="text-gray-500 font-semibold text-lg">Το Όραμά μας</h3>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="text-gray-500 font-bold text-xl">03</div>
                  <div>
                    <h3 className="text-gray-500 font-semibold text-lg">Μεθοδολογία Προπόνησης</h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Image and Content */}
            <div className="relative">
              <img
                src="/lovable-uploads/ed3cca5e-b82b-4492-b0b0-42072072b566.png"
                alt="Κύριος Προπονητής"
                className="w-full h-auto rounded-lg"
              />
              
              <div className="mt-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-[#00ffba] font-bold text-4xl">01</div>
                  <div className="w-full h-0.5 bg-[#00ffba]"></div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-6">Κύριος Προπονητής</h3>
                
                <p className="text-gray-300 leading-relaxed">
                  Το όνομά μου είναι Γιώργος Ζυγούρης και είμαι απόφοιτος της Σχολής Φυσικής Αγωγής και 
                  Αθλητισμού του Αριστοτελείου Πανεπιστημίου Θεσσαλονίκης (2023). Είμαι επαγγελματίας 
                  αθλητής Muay Thai και πιστοποιημένος προπονητής από το 2024. Μέσα από τη διπλή μου οπτική 
                  ως αγωνιστής και εκπαιδευτικός, έχω δημιουργήσει ένα περιβάλλον προπόνησης όπου παιδιά, 
                  έφηβοι και ενήλικες δεν μαθαίνουν απλώς κίνηση—ανακαλύπτουν τις δυνάμεις τους, χτίζουν 
                  χαρακτήρα μέσω του αθλητισμού και βρίσκουν τη μοναδική τους θέση στον αθλητικό κόσμο.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section id="results" className="py-24 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-16">
            Τα Αποτελέσματά Μας
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-6xl font-bold text-[#00ffba] mb-2">500+</div>
              <div className="text-gray-300">Μαθητές</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-6xl font-bold text-[#00ffba] mb-2">50+</div>
              <div className="text-gray-300">Πρωταθλητές</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-6xl font-bold text-[#00ffba] mb-2">10</div>
              <div className="text-gray-300">Χρόνια Εμπειρίας</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-6xl font-bold text-[#00ffba] mb-2">100%</div>
              <div className="text-gray-300">Αφοσίωση</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-black">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Ξεκινήστε Σήμερα
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Ελάτε να γνωρίσετε το χώρο μας και να ξεκινήσετε το δικό σας ταξίδι προς την κορυφή
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-[#00ffba] hover:bg-[#00e6a8] text-black font-semibold text-lg px-8 py-4 rounded-none font-roobert-light font-light">
              Κλείστε Δοκιμαστικό Μάθημα
            </Button>
            <Button variant="outline" size="lg" className="border-white text-white bg-transparent hover:bg-white/10 text-lg px-8 py-4 rounded-none font-roobert-light font-light">
              Επικοινωνήστε Μαζί Μας
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold mb-4">HYPERKIDS</div>
              <p className="text-gray-400 mb-6">
                Δημιουργώντας πρωταθλητές για το μέλλον
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-lg">Επικοινωνία</h3>
              <div className="space-y-2 text-gray-400">
                <p>Διεύθυνση: Κεντρική 123, Αθήνα</p>
                <p>Τηλέφωνο: +30 210 123 4567</p>
                <p>Email: info@hyperkids.gr</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-lg">Ωράριο</h3>
              <div className="space-y-2 text-gray-400">
                <p>Δευτέρα - Παρασκευή: 06:00 - 22:00</p>
                <p>Σάββατο: 08:00 - 20:00</p>
                <p>Κυριακή: 10:00 - 18:00</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2024 HYPERKIDS. Όλα τα δικαιώματα κατοχυρωμένα.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
