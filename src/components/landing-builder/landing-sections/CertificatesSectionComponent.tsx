import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';
import CertificatesSection from '@/components/landing/CertificatesSection';

const defaultTranslations = {
  language: 'el'
};

export const CertificatesSectionComponent: UserComponent = () => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div 
      ref={(ref) => ref && connect(drag(ref))}
      className="relative"
    >
      <CertificatesSection translations={defaultTranslations} />
    </div>
  );
};

CertificatesSectionComponent.craft = {
  displayName: 'Certificates Section',
  props: {},
  related: {}
};
