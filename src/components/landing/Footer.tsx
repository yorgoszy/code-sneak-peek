
import React from 'react';
import { Mail, Phone, Instagram, Youtube, MapPin, Facebook } from 'lucide-react';

interface FooterProps {
  translations: any;
}

const Footer: React.FC<FooterProps> = ({ translations }) => {
  return (
    <footer className="bg-black text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Επικοινωνία */}
          <div>
            <h3 className="text-xl font-bold mb-6" style={{ fontFamily: 'Robert Pro, sans-serif' }}>
              Επικοινωνία
            </h3>
            <div className="space-y-4">
              <a 
                href="https://maps.app.goo.gl/itvAmRgdT8qAG2ZL9"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:text-[#00ffba] transition-colors"
              >
                <MapPin className="w-5 h-5 text-[#00ffba]" />
                <span>an.georgiou 46, thessaloniki 54627</span>
              </a>
              <a 
                href="tel:+302310529104"
                className="flex items-center gap-3 hover:text-[#00ffba] transition-colors"
              >
                <Phone className="w-5 h-5 text-[#00ffba]" />
                <span>+30 2310 529104</span>
              </a>
              <a 
                href="mailto:info@hyperkids.gr"
                className="flex items-center gap-3 hover:text-[#00ffba] transition-colors"
              >
                <Mail className="w-5 h-5 text-[#00ffba]" />
                <span>info@hyperkids.gr</span>
              </a>
            </div>
          </div>

          {/* Logo/Center */}
          <div className="flex flex-col justify-center items-center">
            <img 
              src="/lovable-uploads/d03d7cda-5ce7-49e9-815c-1ecc687bd1aa.png" 
              alt="Performance Logo"
              className="w-20 h-20 mb-6"
            />
            {/* Social Media Icons */}
            <div className="flex justify-center gap-6">
              <a 
                href="https://www.facebook.com/profile.php?id=61561366923734" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-[#00ffba] transition-colors"
              >
                <Facebook className="w-6 h-6" />
              </a>
              <a 
                href="https://www.instagram.com/hyperkids.gr/" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-[#00ffba] transition-colors"
              >
                <Instagram className="w-6 h-6" />
              </a>
              <a 
                href="https://www.tiktok.com/@hyperkids.gr?is_from_webapp=1&sender_device=pc" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-[#00ffba] transition-colors"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a 
                href="https://www.youtube.com/@hyperkids6769" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-[#00ffba] transition-colors"
              >
                <Youtube className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Ώρες */}
          <div className="md:ml-auto">
            <h3 className="text-xl font-bold mb-6" style={{ fontFamily: 'Robert Pro, sans-serif' }}>
              Ώρες
            </h3>
            <div className="space-y-2">
              <p>Δευτέρα - Παρασκευή: 7:00 - 22:00</p>
              <p>Σάββατο: Κλειστά</p>
              <p>Κυριακή: Κλειστά</p>
            </div>
          </div>
        </div>

        <div className="text-center text-gray-400 border-t border-gray-800 pt-8 mt-12">
          <p>© 2024 hyperkids. Όλα τα δικαιώματα διατηρούνται.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
