import React, { useState } from 'react';
import { useNode, UserComponent } from '@craftjs/core';
import AboutSection from '@/components/landing/AboutSection';

const defaultTranslations = {
  language: 'el',
  aboutSection: 'Σχετικά με εμάς',
  supportingYour: 'Υποστηρίζουμε το',
  athleticJourney: 'αθλητικό σου ταξίδι',
  headCoach: 'Επικεφαλής Προπονητής',
  coachDescription: 'Ο Γιώργος Ζυγούρης είναι πιστοποιημένος προπονητής με πολυετή εμπειρία.',
  ourVision: 'Το Όραμά μας',
  visionDescription: 'Δημιουργούμε τους αθλητές του αύριο.',
  trainingMethodology: 'Μεθοδολογία Προπόνησης',
  trainingMethodologyDescription: 'Επιστημονικά τεκμηριωμένη προσέγγιση.',
  academicBackground: 'Ακαδημαϊκό Υπόβαθρο',
  academicDescription: 'Πτυχίο ΤΕΦΑΑ',
  professionalAthlete: 'Επαγγελματίας Αθλητής',
  professionalDescription: 'Πρώην επαγγελματίας αθλητής',
  coreValues: 'Βασικές Αξίες',
  coreValuesDescription: 'Πειθαρχία, Αφοσίωση, Αποτελέσματα',
  moreThanPhysical: 'Περισσότερο από Φυσική Κατάσταση',
  moreThanPhysicalDesc: 'Αναπτύσσουμε τον χαρακτήρα',
  buildingCharacter: 'Χτίζοντας Χαρακτήρα',
  buildingCharacterDesc: 'Μέσα από τον αθλητισμό',
  trustTheProcess: 'Εμπιστεύσου τη Διαδικασία',
  trustTheProcessDesc: 'Τα αποτελέσματα έρχονται',
  movementSkills: 'Κινητικές Δεξιότητες',
  assessment: 'Αξιολόγηση',
  resultsFocused: 'Εστίαση στα Αποτελέσματα'
};

export const AboutSectionComponent: UserComponent = () => {
  const { connectors: { connect, drag } } = useNode();
  const [activeSection, setActiveSection] = useState(1);

  return (
    <div 
      ref={(ref) => ref && connect(drag(ref))}
      className="relative"
    >
      <AboutSection
        translations={defaultTranslations}
        activeAboutSection={activeSection}
        onSetActiveAboutSection={setActiveSection}
      />
    </div>
  );
};

AboutSectionComponent.craft = {
  displayName: 'About Section',
  props: {},
  related: {}
};
