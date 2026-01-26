import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';

const defaultPrograms = [
  {
    id: 'hyperkids',
    title: 'HyperKids',
    description: 'Αθλητική ανάπτυξη για παιδιά 6-12 ετών',
    color: '#00ffba'
  },
  {
    id: 'hypergym',
    title: 'HyperGym',
    description: 'Προσωπική προπόνηση για ενήλικες',
    color: '#cb8954'
  },
  {
    id: 'hyperathletes',
    title: 'HyperAthletes',
    description: 'Εξειδικευμένη προπόνηση για αθλητές',
    color: '#aca097'
  }
];

export const ProgramsSectionComponent: UserComponent = () => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div 
      ref={(ref) => ref && connect(drag(ref))}
      className="relative"
    >
      <section id="programs" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            Προγράμματα
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {defaultPrograms.map((program) => (
              <div 
                key={program.id}
                className="bg-gray-50 rounded-none p-6 hover:shadow-lg transition-shadow"
                style={{ borderTop: `4px solid ${program.color}` }}
              >
                <h3 className="text-xl font-semibold mb-2" style={{ color: program.color }}>
                  {program.title}
                </h3>
                <p className="text-gray-600">{program.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

ProgramsSectionComponent.craft = {
  displayName: 'Programs Section',
  props: {},
  related: {}
};
