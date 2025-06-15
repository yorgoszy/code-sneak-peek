
import React from 'react';
import { Mail, Phone, Instagram, Youtube } from 'lucide-react';

interface ContactSectionProps {
  translations: any;
}

const ContactSection: React.FC<ContactSectionProps> = ({ translations }) => {
  return (
    <section id="contact" className="py-20 bg-[#00ffba] text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Robert Pro, sans-serif' }}>
          Έτοιμος να ανεβάσεις την απόδοσή σου;
        </h2>
        <p className="text-lg mb-8 max-w-3xl mx-auto">
          Γίνε μέλος της κοινότητάς μας αθλητών και ξεκίνα το ταξίδι σου προς την κορυφαία απόδοση σήμερα.
        </p>
        <button className="bg-transparent border-2 border-black text-black px-8 py-3 font-semibold hover:bg-black hover:text-[#00ffba] transition-colors">
          ΞΕΚΙΝΑ ΤΩΡΑ
        </button>
      </div>
    </section>
  );
};

export default ContactSection;
