
import React from 'react';
import { Mail, Phone, Instagram, Youtube } from 'lucide-react';

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
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#00ffba] flex items-center justify-center">
                  <div className="w-2 h-2 bg-black rounded-full"></div>
                </div>
                <span>an.georgiou 46, thessaloniki 54627</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#00ffba]" />
                <span>+30 2310 529104</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#00ffba]" />
                <span>info@hyperkids.gr</span>
              </div>
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
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#00ffba] hover:text-black transition-colors"
              >
                <div className="w-5 h-5 bg-white"></div>
              </a>
              <a 
                href="https://www.instagram.com/hyperkids.gr/" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#00ffba] hover:text-black transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="https://www.tiktok.com/@hyperkids.gr?is_from_webapp=1&sender_device=pc" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#00ffba] hover:text-black transition-colors"
              >
                <div className="w-5 h-5 bg-white rounded"></div>
              </a>
              <a 
                href="https://www.youtube.com/@hyperkids6769" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#00ffba] hover:text-black transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Ώρες */}
          <div>
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
          <p>© 2024 Performance. Όλα τα δικαιώματα διατηρούνται.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
