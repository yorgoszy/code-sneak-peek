
import React from 'react';
import { Mail, Phone, Instagram, Youtube, MapPin, Facebook } from 'lucide-react';

interface FooterProps {
  translations: any;
}

const Footer: React.FC<FooterProps> = ({ translations }) => {
  return (
    <footer id="footer" className="bg-black py-16 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Επικοινωνία */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-white" style={{ fontFamily: 'Robert Pro, sans-serif' }}>
              {translations.contactTitle}
            </h3>
            <div className="space-y-4">
              <a 
                href="https://maps.app.goo.gl/itvAmRgdT8qAG2ZL9"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:opacity-80 transition-colors"
              >
                <MapPin className="w-5 h-5 text-white" />
                <span>an.georgiou 46, thessaloniki 54627</span>
              </a>
              <a 
                href="tel:+302310529104"
                className="flex items-center gap-3 hover:opacity-80 transition-colors"
              >
                <Phone className="w-5 h-5 text-white" />
                <span>+30 2310 529104</span>
              </a>
              <a 
                href="mailto:info@hyperkids.gr"
                className="flex items-center gap-3 hover:opacity-80 transition-colors"
              >
                <Mail className="w-5 h-5 text-white" />
                <span>info@hyperkids.gr</span>
              </a>
            </div>
          </div>

          {/* Logo/Center */}
          <div className="flex flex-col justify-center items-center">
            <img 
              src="/assets/logo.png" 
              alt="Performance Logo"
              className="w-20 h-20 mb-6"
            />
            {/* Social Media Icons */}
            <div className="flex justify-center gap-6">
              <a 
                href="https://www.facebook.com/profile.php?id=61561366923734" 
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-colors text-white"
              >
                <Facebook className="w-6 h-6" />
              </a>
              <a 
                href="https://www.instagram.com/hyperkids.gr/" 
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-colors text-white"
              >
                <Instagram className="w-6 h-6" />
              </a>
              <a 
                href="https://www.tiktok.com/@hyperkids.gr?is_from_webapp=1&sender_device=pc" 
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-colors text-white"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a 
                href="https://www.youtube.com/@hyperkids6769" 
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-colors text-white"
              >
                <Youtube className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Ώρες */}
          <div className="md:ml-auto">
            <h3 className="text-xl font-bold mb-6 text-white" style={{ fontFamily: 'Robert Pro, sans-serif' }}>
              {translations.hoursTitle}
            </h3>
            <div className="space-y-2 text-white">
              <p>{translations.mondayFriday}</p>
              <p>{translations.saturday}</p>
              <p>{translations.sunday}</p>
            </div>
          </div>
        </div>

        <div className="text-center border-t border-gray-800 pt-8 mt-12 text-white">
          <p>{translations.copyright}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
