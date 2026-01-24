import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';
import Navigation from '@/components/landing/Navigation';

const defaultTranslations = {
  language: 'el',
  home: 'Αρχική',
  programs: 'Προγράμματα',
  about: 'Σχετικά',
  contact: 'Επικοινωνία',
  login: 'Σύνδεση',
  dashboard: 'Dashboard'
};

const defaultNavItems = [
  { name: 'Αρχική', href: '#home' },
  { name: 'Υπηρεσίες', href: '#programs' },
  { name: 'Σχετικά', href: '#about' },
  { name: 'Blog', href: '#blog' },
  { name: 'Επικοινωνία', href: '#contact' },
];

export const NavigationSectionComponent: UserComponent = () => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div 
      ref={(ref) => ref && connect(drag(ref))}
      className="relative"
    >
      <Navigation
        navigationItems={defaultNavItems}
        isAuthenticated={false}
        loading={false}
        language="el"
        onToggleLanguage={() => {}}
        onSignOut={() => {}}
        translations={defaultTranslations}
      />
    </div>
  );
};

NavigationSectionComponent.craft = {
  displayName: 'Navigation',
  props: {},
  related: {}
};
