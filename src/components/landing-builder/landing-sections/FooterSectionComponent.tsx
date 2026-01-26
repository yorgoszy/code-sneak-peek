import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export const FooterSectionComponent: UserComponent = () => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div 
      ref={(ref) => ref && connect(drag(ref))}
      className="relative"
    >
      <footer id="footer" className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Επικοινωνία</h3>
              <div className="space-y-3 text-gray-400">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-3 text-[#00ffba]" />
                  <span>Διεύθυνση γυμναστηρίου</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-5 h-5 mr-3 text-[#00ffba]" />
                  <span>+30 123 456 7890</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-5 h-5 mr-3 text-[#00ffba]" />
                  <span>info@hyperkids.gr</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Ωράριο</h3>
              <div className="space-y-2 text-gray-400">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-3 text-[#cb8954]" />
                  <span>Δευτέρα - Παρασκευή: 08:00 - 21:00</span>
                </div>
                <div className="ml-8">Σάββατο: 09:00 - 15:00</div>
                <div className="ml-8">Κυριακή: Κλειστά</div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Σύνδεσμοι</h3>
              <div className="space-y-2 text-gray-400">
                <a href="#" className="block hover:text-[#00ffba] transition-colors">Αρχική</a>
                <a href="#" className="block hover:text-[#00ffba] transition-colors">Προγράμματα</a>
                <a href="#" className="block hover:text-[#00ffba] transition-colors">Blog</a>
                <a href="#" className="block hover:text-[#00ffba] transition-colors">Επικοινωνία</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500">
            © 2024 HyperKids. Όλα τα δικαιώματα κατοχυρωμένα.
          </div>
        </div>
      </footer>
    </div>
  );
};

FooterSectionComponent.craft = {
  displayName: 'Footer',
  props: {},
  related: {}
};
