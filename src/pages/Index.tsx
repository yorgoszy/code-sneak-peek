import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleLoginClick = () => {
    navigate('/auth');
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div style={{ fontFamily: 'Robert Pro, sans-serif' }} className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <img 
                  src="/lovable-uploads/77591c7f-20d5-4ab2-ab03-5ae09f70daf5.png" 
                  alt="Hyperkids Logo" 
                  className="h-12 w-auto"
                />
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('hero')}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                ΑΡΧΙΚΗ
              </button>
              <button 
                onClick={() => scrollToSection('programs')}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                ΠΡΟΓΡΑΜΜΑΤΑ
              </button>
              <button 
                onClick={() => scrollToSection('services')}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                ΥΠΗΡΕΣΙΕΣ
              </button>
              <button 
                onClick={() => scrollToSection('about')}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                ΕΤΑΙΡΙΑ
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                ΕΠΙΚΟΙΝΩΝΙΑ
              </button>
              <button 
                onClick={() => scrollToSection('blog')}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                BLOG
              </button>
              <button 
                onClick={handleLoginClick}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                <User className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <button 
                onClick={() => { scrollToSection('hero'); setIsMobileMenuOpen(false); }}
                className="block text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium w-full text-left"
              >
                ΑΡΧΙΚΗ
              </button>
              <button 
                onClick={() => { scrollToSection('programs'); setIsMobileMenuOpen(false); }}
                className="block text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium w-full text-left"
              >
                ΠΡΟΓΡΑΜΜΑΤΑ
              </button>
              <button 
                onClick={() => { scrollToSection('services'); setIsMobileMenuOpen(false); }}
                className="block text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium w-full text-left"
              >
                ΥΠΗΡΕΣΙΕΣ
              </button>
              <button 
                onClick={() => { scrollToSection('about'); setIsMobileMenuOpen(false); }}
                className="block text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium w-full text-left"
              >
                ΕΤΑΙΡΙΑ
              </button>
              <button 
                onClick={() => { scrollToSection('contact'); setIsMobileMenuOpen(false); }}
                className="block text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium w-full text-left"
              >
                ΕΠΙΚΟΙΝΩΝΙΑ
              </button>
              <button 
                onClick={() => { scrollToSection('blog'); setIsMobileMenuOpen(false); }}
                className="block text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium w-full text-left"
              >
                BLOG
              </button>
              <button 
                onClick={() => { handleLoginClick(); setIsMobileMenuOpen(false); }}
                className="flex items-center text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium w-full text-left"
              >
                <User className="h-5 w-5 mr-2" />
                LOGIN
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative bg-cover bg-center h-screen flex items-center justify-center" style={{ backgroundImage: `url('/lovable-uploads/69e99599-09bd-4249-a491-5328696a996d.png')` }}>
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="container mx-auto text-center relative z-10">
          <h1 className="text-5xl font-bold text-white mb-4">ΑΘΛΗΤΙΚΗ ΕΤΟΙΜΑΣΙΑ ΓΙΑ <br />ΠΑΙΔΙΑ & ΕΦΗΒΟΥΣ</h1>
          <p className="text-xl text-gray-300 mb-8">Εξειδικευμένα προγράμματα για την ανάπτυξη των αυριανών αθλητών.</p>
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full">
            Ξεκινήστε Σήμερα
          </button>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-20 bg-gray-100">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-semibold text-gray-800 mb-12">Τα Προγράμματά Μας</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Program Card 1 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <img src="https://via.placeholder.com/350x200" alt="Program" className="mb-4 rounded-md" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Ακαδημία Ποδοσφαίρου</h3>
              <p className="text-gray-600">Εκμάθηση βασικών δεξιοτήτων και τακτικών ποδοσφαίρου.</p>
            </div>
            {/* Program Card 2 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <img src="https://via.placeholder.com/350x200" alt="Program" className="mb-4 rounded-md" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Τμήμα Κολύμβησης</h3>
              <p className="text-gray-600">Ανάπτυξη τεχνικών κολύμβησης και φυσικής κατάστασης.</p>
            </div>
            {/* Program Card 3 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <img src="https://via.placeholder.com/350x200" alt="Program" className="mb-4 rounded-md" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Στίβος</h3>
              <p className="text-gray-600">Βελτίωση ταχύτητας, αντοχής και τεχνικών στίβου.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-semibold text-gray-800 mb-12">Οι Υπηρεσίες Μας</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Service Card 1 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <img src="https://via.placeholder.com/100x100" alt="Service" className="mb-4 rounded-full mx-auto" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Προσωπική Προπόνηση</h3>
              <p className="text-gray-600">Εξατομικευμένα προγράμματα προπόνησης.</p>
            </div>
            {/* Service Card 2 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <img src="https://via.placeholder.com/100x100" alt="Service" className="mb-4 rounded-full mx-auto" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Διατροφική Υποστήριξη</h3>
              <p className="text-gray-600">Συμβουλές διατροφής για αθλητές.</p>
            </div>
            {/* Service Card 3 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <img src="https://via.placeholder.com/100x100" alt="Service" className="mb-4 rounded-full mx-auto" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Αθλητική Ψυχολογία</h3>
              <p className="text-gray-600">Υποστήριξη για την ψυχική ενδυνάμωση.</p>
            </div>
            {/* Service Card 4 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <img src="https://via.placeholder.com/100x100" alt="Service" className="mb-4 rounded-full mx-auto" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Φυσικοθεραπεία</h3>
              <p className="text-gray-600">Αποκατάσταση τραυματισμών.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-100">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Image */}
            <div>
              <img src="https://via.placeholder.com/500x400" alt="About Us" className="rounded-lg shadow-md" />
            </div>
            {/* Text Content */}
            <div>
              <h2 className="text-3xl font-semibold text-gray-800 mb-4">Σχετικά με Εμάς</h2>
              <p className="text-gray-600 mb-6">Η Hyperkids είναι μια πρωτοποριακή ακαδημία αθλητικής προετοιμασίας για παιδιά και εφήβους. Στόχος μας είναι να αναπτύξουμε τους αυριανούς αθλητές, παρέχοντας εξειδικευμένα προγράμματα και υπηρεσίες.</p>
              <p className="text-gray-600">Με έμπειρους προπονητές και σύγχρονες μεθόδους, προσφέρουμε μια ολοκληρωμένη προσέγγιση στην αθλητική ανάπτυξη.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-semibold text-gray-800 mb-12">Επικοινωνήστε Μαζί Μας</h2>
          <div className="max-w-lg mx-auto">
            <form className="space-y-6">
              <div>
                <input type="text" placeholder="Όνομα" className="w-full p-4 border rounded-md" />
              </div>
              <div>
                <input type="email" placeholder="Email" className="w-full p-4 border rounded-md" />
              </div>
              <div>
                <textarea placeholder="Μήνυμα" className="w-full p-4 border rounded-md"></textarea>
              </div>
              <div>
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full w-full">
                  Αποστολή
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="py-20 bg-gray-100">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-semibold text-gray-800 mb-12">Blog</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Blog Post 1 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <img src="https://via.placeholder.com/350x200" alt="Blog Post" className="mb-4 rounded-md" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Τίτλος Άρθρου 1</h3>
              <p className="text-gray-600">Περιγραφή του άρθρου...</p>
            </div>
            {/* Blog Post 2 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <img src="https://via.placeholder.com/350x200" alt="Blog Post" className="mb-4 rounded-md" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Τίτλος Άρθρου 2</h3>
              <p className="text-gray-600">Περιγραφή του άρθρου...</p>
            </div>
            {/* Blog Post 3 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <img src="https://via.placeholder.com/350x200" alt="Blog Post" className="mb-4 rounded-md" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Τίτλος Άρθρου 3</h3>
              <p className="text-gray-600">Περιγραφή του άρθρου...</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 py-8 text-center">
        <p className="text-white">© 2024 Hyperkids. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
