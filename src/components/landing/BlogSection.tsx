
import React from 'react';

interface BlogSectionProps {
  translations: any;
}

const BlogSection: React.FC<BlogSectionProps> = ({ translations }) => {
  return (
    <section id="blog" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{translations.blogSection}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {translations.blogDescription}
          </p>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
