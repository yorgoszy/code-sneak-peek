import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';
import { Calendar, Clock } from 'lucide-react';

const schedule = [
  { day: 'Δευτέρα', hours: '08:00 - 21:00', available: 3 },
  { day: 'Τρίτη', hours: '08:00 - 21:00', available: 5 },
  { day: 'Τετάρτη', hours: '08:00 - 21:00', available: 2 },
  { day: 'Πέμπτη', hours: '08:00 - 21:00', available: 4 },
  { day: 'Παρασκευή', hours: '08:00 - 21:00', available: 6 },
  { day: 'Σάββατο', hours: '09:00 - 15:00', available: 1 },
  { day: 'Κυριακή', hours: 'Κλειστά', available: 0 }
];

export const LiveProgramSectionComponent: UserComponent = () => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div 
      ref={(ref) => ref && connect(drag(ref))}
      className="relative"
    >
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
            <Calendar className="inline-block w-8 h-8 mr-2 text-[#00ffba]" />
            Live Πρόγραμμα
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Δείτε τις διαθέσιμες θέσεις για κάθε ημέρα
          </p>
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
            {schedule.map((item, i) => (
              <div 
                key={i} 
                className={`p-4 rounded-none text-center ${
                  item.available > 0 ? 'bg-white border border-gray-200' : 'bg-gray-200'
                }`}
              >
                <div className="font-semibold text-gray-900 mb-2">{item.day}</div>
                <div className="text-xs text-gray-500 mb-2 flex items-center justify-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {item.hours}
                </div>
                <div className={`text-sm font-medium ${
                  item.available > 0 ? 'text-[#00ffba]' : 'text-gray-400'
                }`}>
                  {item.available > 0 ? `${item.available} θέσεις` : 'Κλειστό'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

LiveProgramSectionComponent.craft = {
  displayName: 'Live Program Section',
  props: {},
  related: {}
};
