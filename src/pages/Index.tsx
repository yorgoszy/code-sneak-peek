import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Menu, X, User, Globe } from "lucide-react";

const Index = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      <section id="home" className="relative min-h-screen flex items-center">
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
            <Button size="lg" className="text-lg px-8 py-4 bg-[#00ffba] hover:bg-[#00e6a8] text-black rounded-none font-roobert-light font-light">
              GET STARTED
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4 border-white text-white bg-transparent hover:bg-white/10 rounded-none font-roobert-light font-light">
              CONTACT
            </Button>
          </div>
          
          {/* Scroll Down Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="text-center">
              <div className="text-sm text-gray-300 mb-2">SCROLL DOWN</div>
              <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
                <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-bounce"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-24 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Τα Προγράμματα Μας
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Εξατομικευμένα προγράμματα προπόνησης για όλα τα επίπεδα
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-black/50 backdrop-blur-sm border border-gray-700 rounded-lg p-8 hover:border-[#00ffba] transition-colors">
              <h3 className="text-2xl font-bold text-white mb-4">Αρχάριοι</h3>
              <p className="text-gray-300 mb-6">Ξεκινήστε το ταξίδι σας με ασφάλεια και σωστή τεχνική</p>
              <Button className="w-full bg-[#00ffba] hover:bg-[#00e6a8] text-black rounded-none font-roobert-light font-light">
                Μάθετε Περισσότερα
              </Button>
            </div>
            
            <div className="bg-black/50 backdrop-blur-sm border border-gray-700 rounded-lg p-8 hover:border-[#00ffba] transition-colors">
              <h3 className="text-2xl font-bold text-white mb-4">Μεσαίο Επίπεδο</h3>
              <p className="text-gray-300 mb-6">Αναπτύξτε τις δεξιότητές σας και βελτιώστε την απόδοσή σας</p>
              <Button className="w-full bg-[#00ffba] hover:bg-[#00e6a8] text-black rounded-none font-roobert-light font-light">
                Μάθετε Περισσότερα
              </Button>
            </div>
            
            <div className="bg-black/50 backdrop-blur-sm border border-gray-700 rounded-lg p-8 hover:border-[#00ffba] transition-colors">
              <h3 className="text-2xl font-bold text-white mb-4">Προχωρημένοι</h3>
              <p className="text-gray-300 mb-6">Εντατική προπόνηση για αθλητές υψηλού επιπέδου</p>
              <Button className="w-full bg-[#00ffba] hover:bg-[#00e6a8] text-black rounded-none font-roobert-light font-light">
                Μάθετε Περισσότερα
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="schedule" className="py-24 bg-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
                Σχετικά Με Εμάς
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Στο HYPERKIDS δημιουργούμε πρωταθλητές. Με χρόνια εμπειρίας και πάθος για το άθλημα, 
                προσφέρουμε την καλύτερη δυνατή εκπαίδευση.
              </p>
              <Button className="bg-[#00ffba] hover:bg-[#00e6a8] text-black px-8 py-3 rounded-none font-roobert-light font-light">
                Μάθετε Περισσότερα
              </Button>
            </div>
            <div className="bg-gray-800 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Ωράριο Λειτουργίας</h3>
              <div className="space-y-4 text-gray-300">
                <div className="flex justify-between">
                  <span>Δευτέρα - Παρασκευή</span>
                  <span>06:00 - 22:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Σάββατο</span>
                  <span>08:00 - 20:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Κυριακή</span>
                  <span>10:00 - 18:00</span>
                </div>
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
