import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';
import BlogSection from '@/components/landing/BlogSection';

const defaultTranslations = {
  language: 'el',
  blogSection: 'Blog',
  readMore: 'Διαβάστε περισσότερα'
};

export const BlogSectionComponent: UserComponent = () => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div 
      ref={(ref) => ref && connect(drag(ref))}
      className="relative"
    >
      <BlogSection translations={defaultTranslations} />
    </div>
  );
};

BlogSectionComponent.craft = {
  displayName: 'Blog Section',
  props: {},
  related: {}
};
