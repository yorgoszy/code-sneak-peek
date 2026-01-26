import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';

export const BlogSectionComponent: UserComponent = () => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div 
      ref={(ref) => ref && connect(drag(ref))}
      className="relative"
    >
      <section id="blog" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            Blog
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-none overflow-hidden">
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">Εικόνα άρθρου</span>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Τίτλος Άρθρου</h3>
                <p className="text-gray-600 text-sm">Περιγραφή του άρθρου...</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-none overflow-hidden">
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">Εικόνα άρθρου</span>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Τίτλος Άρθρου</h3>
                <p className="text-gray-600 text-sm">Περιγραφή του άρθρου...</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-none overflow-hidden">
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">Εικόνα άρθρου</span>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Τίτλος Άρθρου</h3>
                <p className="text-gray-600 text-sm">Περιγραφή του άρθρου...</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

BlogSectionComponent.craft = {
  displayName: 'Blog Section',
  props: {},
  related: {}
};
