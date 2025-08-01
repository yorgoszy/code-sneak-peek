
import { useState } from 'react';

export const useTranslations = () => {
  const [language, setLanguage] = useState<'el' | 'en'>('el');

  const translations = {
    el: {
      language: 'el',
      home: "Αρχική",
      programs: "Υπηρεσίες",
      blog: "Άρθρα",
      about: "Σχετικά με εμάς",
      results: "Αποτελέσματα",
      contact: "Επικοινωνία",
      login: "Σύνδεση",
      dashboard: "Dashboard",
      getStarted: "ΞΕΚΙΝΑ ΤΩΡΑ",
      contactBtn: "ΕΠΙΚΟΙΝΩΝΙΑ",
      heroTitle: "Το ταξίδι του πρωταθλητή",
      heroSubtitle: "Ξεκινάει εδώ",
      explorePrograms: "Υπηρεσίες",
      blogSection: "Άρθρα",
      blogDescription: "Ενημερωθείτε με τα τελευταία άρθρα και συμβουλές από τους ειδικούς μας",
      aboutSection: "Σχετικά με εμάς",
      aboutDescription: "Μάθετε περισσότερα για την ομάδα μας και την αποστολή μας",
      resultsSection: "Αποτελέσματα",
      resultsDescription: "Δείτε τα εντυπωσιακά αποτελέσματα των συμμετεχόντων μας",
      contactSection: "Επικοινωνία",
      contactDescription: "Επικοινωνήστε μαζί μας για περισσότερες πληροφορίες",
      bibliography: "Βιβλιογραφία:",
      readyQuestion: "Είσαι έτοιμος;",
      journeyText: "Το ταξίδι προς την κορυφή ξεκινάει εδώ.",
      startNow: "Ξεκίνα τώρα",
      contactTitle: "Επικοινωνία",
      hoursTitle: "Ώρες",
      mondayFriday: "Δευτέρα - Παρασκευή: 7:00 - 22:00",
      saturday: "Σάββατο: Κλειστά",
      sunday: "Κυριακή: Κλειστά",
      copyright: "© 2024 hyperkids. Όλα τα δικαιώματα διατηρούνται.",
      movementLearning: "Εκμάθηση Κίνησης",
      movementLearningDesc: "Εισαγωγικές τεχνικές κίνησης",
      movementDevelopment: "Ανάπτυξη Κίνησης",
      movementDevelopmentDesc: "Χτίζοντας αθλητικές βάσεις για όλα τα σπορ",
      youthStrength: "Δύναμη Νέων",
      youthStrengthDesc: "Προχωρημένες τεχνικές και φυσική κατάσταση",
      fitness: "Φυσική Κατάσταση",
      fitnessDesc: "Προσαρμοσμένες λύσεις φυσικής κατάστασης για όλα τα επίπεδα",
      muayThai: "Muay Thai",
      muayThaiDesc: "Μέθοδοι Προπόνησης Νέας Γενιάς",
      oneByOne: "Προπόνηση Ένας προς Έναν",
      oneByOneDesc: "Εξατομικευμένη προπονητική για μέγιστα αποτελέσματα",
      athletePerformance: "Αθλητική Απόδοση",
      athletePerformanceDesc: "Ελίτ Στρατηγικές Δύναμης & Φυσικής Κατάστασης",
      customProgramDesign: "Εξατομικευμένος Σχεδιασμός Προγράμματος",
      customProgramDesignDesc: "Εξατομικευμένα προγράμματα προπόνησης σχεδιασμένα ειδικά για τους στόχους και τις ανάγκες σας",
      readyTemplate: "Έτοιμα Πρότυπα Προγραμμάτων",
      readyTemplateDesc: "Έτοιμα πρότυπα προγραμμάτων προπόνησης για άμεση εφαρμογή και γρήγορα αποτελέσματα",
      supportingYour: "Υποστηρίζοντας το",
      athleticJourney: "αθλητικό σας ταξίδι",
      headCoach: "Κύριος προπονητής",
      ourVision: "Το όραμά μας",
      trainingMethodology: "Μεθοδολογία προπόνησης",
      coachName: "Γεώργιος Ζυγούρης",
      coachDescription: "Με ονομάζουν Γεώργιο Ζυγούρη, και είμαι απόφοιτος της Σχολής Φυσικής Αγωγής και Αθλητισμού του Αριστοτελείου Πανεπιστημίου Θεσσαλονίκης (2023). Είμαι επαγγελματίας αθλητής Muay Thai και πιστοποιημένος προπονητής από το 2024. Μέσω της διπλής μου προοπτικής ως αγωνιστή και εκπαιδευτικός, έχω δημιουργήσει ένα προπονητικό περιβάλλον όπου παιδιά, εφηβοι, και ενήλικες δεν μαθαίνουν απλώς κίνηση—ανακαλύπτουν τις δυνάμεις τους, χτίζουν χαρακτήρα μέσω του αθλητισμού, και βρίσκουν τη μοναδική τους θέση στον αθλητικό κόσμο.",
      visionDescription: "Συνδυάζοντας επιστημονική γνώση με πραγματική εμπειρία, εφαρμόζουμε ανάπτυξη δεξιοτήτων και προπόνηση εστιασμένη στην απόδοση, προσαρμοσμένη σε κάθε ηλικία και στάδιο. Βλέπουμε την κίνηση ως κάτι περισσότερο από φυσικό — είναι αυτοέκφραση, αυτοπεποίθηση και η δύναμη να μεγαλώνουμε μέσα από την πρόκληση. Η αποστολή μας είναι να βοηθήσουμε τους νέους να εμπιστευτούν τη διαδικασία και να εξερευνήσουν τις δυνατότητές τους σε έναν ασφαλή, υποστηρικτικό χώρο.",
      academicBackground: "Ακαδημαϊκό Υπόβαθρο",
      academicDescription: "Απόφοιτος της Σχολής Φυσικής Αγωγής και Αθλητισμού του Αριστοτελείου Πανεπιστημίου Θεσσαλονίκης (2023)",
      professionalAthlete: "Επαγγελματίας Αθλητής",
      professionalDescription: "Επαγγελματίας αθλητής Muay Thai με εμπειρία σε αγώνες υψηλού επιπέδου",
      coreValues: "Βασικές Αξίες",
      coreValuesDescription: "Ο στόχος μας δεν είναι μόνο η σωματική βελτίωση, αλλά και η καλλιέργεια αυτοπεποίθησης, χαρακτήρα και βασικών αξιών",
      moreThanPhysical: "Περισσότερο από Φυσικό",
      moreThanPhysicalDesc: "Δεν προπονούμε απλώς σώματα. Διαμορφώνουμε χαρακτήρα. Κάθε παιδί είναι ένας κόσμος σε κίνηση, και η κίνηση είναι αυτοέκφραση, αυτοπεποίθηση και ανάπτυξη.",
      buildingCharacter: "Χτίσιμο Χαρακτήρα",
      buildingCharacterDesc: "Διδάσκουμε σεβασμό, πειθαρχία, επιμονή και συνεργασία. Στόχος μας είναι να δημιουργήσουμε ένα σχολείο ζωής όπου τα παιδιά μαθαίνουν να στέκονται όρθια φυσικά, ψυχικά και ηθικά.",
      trustTheProcess: "Εμπιστοσύνη στη Διαδικασία",
      trustTheProcessDesc: "Για εμάς, το αύριο αρχίζει σήμερα. Βήμα βήμα. Με εμπιστοσύνη στη διαδικασία. Με το κουράγιο να πάμε παραπέρα. Με τη θέληση να ξεπεράσουμε τα όρια.",
      trainingMethodologyDescription: "Η μεθοδολογία προπόνησής μας εστιάζει στην προοδευτική ανάπτυξη δεξιοτήτων και την ενίσχυση των σωστών κινητικών προτύπων προσαρμοσμένων στις ανάγκες και στόχους κάθε ατόμου. Μέσω ολοκληρωμένης αξιολόγησης, κατανοούμε τις τρέχουσες ικανότητες και αδυναμίες σας, καθορίζουμε σαφείς στόχους προπόνησης, δημιουργούμε ένα δομημένο χρονοδιάγραμμα για την επίτευξη και σχεδιάζουμε ένα αποκλειστικό εξατομικευμένο πρόγραμμα προπόνησης ειδικά για εσάς.",
      movementSkills: "Κινητικές Δεξιότητες",
      movementSkillsDesc: "Ανάπτυξη Αθλητικών Δεξιοτήτων\n• Κατάλληλα για την Ηλικία\n• Ρίψεις & Πιασίματα, Δεξιότητες Αναρρίχησης, Άλματα & Προσγειώσεις, Ευκινησία, Τρέξιμο, Συντονισμός",
      assessment: "Αξιολόγηση",
      assessmentDesc: "Κίνηση & Στάση\n• Προφίλ φορτίου - ταχύτητας\n• Προφίλ άλματος\n• Αντοχή",
      resultsFocused: "Εστιασμένα στα Αποτελέσματα",
      resultsFocusedDesc: "Παρακολούθηση Αποτελεσμάτων\n• Καθοδήγηση Απόδοσης\n• Ανάπτυξη Προσαρμοσμένου Προγράμματος",
      learnMore: "Μάθετε περισσότερα",
      // New services
      hyperkids: "hyperkids",
      hyperkidsDesc: "Εξειδικευμένο πρόγραμμα για παιδιά ηλικίας 4-12 ετών που εστιάζει στην ανάπτυξη βασικών κινητικών δεξιοτήτων, συντονισμού και αθλητικών αξιών μέσα από διασκεδαστικές δραστηριότητες",
      hypergym: "hypergym", 
      hypergymDesc: "Σύγχρονο γυμναστήριο με εξειδικευμένο εξοπλισμό για προπόνηση δύναμης, φυσικής κατάστασης και αθλητικής απόδοσης για όλες τις ηλικίες και τα επίπεδα",
      hyperathletes: "hyperathletes",
      hyperathletesDesc: "Μέθοδοι Προπόνησης Νέας Γενιάς"
    },
    en: {
      language: 'en',
      home: "Home",
      programs: "Services",
      blog: "Blog",
      about: "About Us",
      results: "Results",
      contact: "Contact",
      login: "Login",
      dashboard: "Dashboard",
      getStarted: "GET STARTED",
      contactBtn: "CONTACT",
      heroTitle: "The champion's journey",
      heroSubtitle: "starts here",
      explorePrograms: "Explore all services",
      blogSection: "Blog",
      blogDescription: "Read the latest articles and tips from our experts",
      aboutSection: "About Us",
      aboutDescription: "Learn more about our team and mission",
      resultsSection: "Results",
      resultsDescription: "See the impressive results of our participants",
      contactSection: "Contact",
      contactDescription: "Contact us for more information",
      bibliography: "Bibliography:",
      readyQuestion: "Are you ready?",
      journeyText: "The journey to the top starts here.",
      startNow: "Get Started Now",
      contactTitle: "Contact",
      hoursTitle: "Hours",
      mondayFriday: "Monday - Friday: 7:00 - 22:00",
      saturday: "Saturday: Closed",
      sunday: "Sunday: Closed",
      copyright: "© 2024 hyperkids. All rights reserved.",
      movementLearning: "Movement Learning",
      movementLearningDesc: "Introductory movement techniques",
      movementDevelopment: "Movement Development",
      movementDevelopmentDesc: "Building athletic foundations for all sports",
      youthStrength: "Youth Strength",
      youthStrengthDesc: "Advanced techniques and conditioning",
      fitness: "Fitness",
      fitnessDesc: "Customized fitness solutions for all levels",
      muayThai: "Muay Thai",
      muayThaiDesc: "Next-Gen Training Methods",
      oneByOne: "One by One Training",
      oneByOneDesc: "Personalized coaching for maximum results",
      athletePerformance: "Athlete Performance",
      athletePerformanceDesc: "Elite Strength & Conditioning Strategies",
      customProgramDesign: "Custom Program Design",
      customProgramDesignDesc: "Personalized training programs designed specifically for your goals and needs",
      readyTemplate: "Ready Training Template",
      readyTemplateDesc: "Ready-made training program templates for immediate implementation and quick results",
      supportingYour: "Supporting your",
      athleticJourney: "athletic journey",
      headCoach: "Head coach",
      ourVision: "Our vision",
      trainingMethodology: "Training methodology",
      coachName: "Georgios Zygouris",
      coachDescription: "My name is Georgios Zygouris, and I am a graduate of the School of Physical Education and Sport Science at the Aristotle University of Thessaloniki (2023). I am a professional Muay Thai athlete and a certified coach since 2024. Through my dual perspective as both competitor and educator, I've established a training environment where children, teenagers, and adults don't just learn movement—they discover their strengths, build character through sport, and find their unique position in the athletic world.",
      visionDescription: "Our Vision\nCombining scientific knowledge with real-world experience, we apply skill development and performance-focused training tailored to each age and stage. We see movement as more than physical — it's self-expression, confidence, and the power to grow through challenge. Our mission is to help young people trust the process and explore their potential in a safe, supportive space.",
      academicBackground: "Academic Background",
      academicDescription: "Graduate of the School of Physical Education and Sport Science at the Aristotle University of Thessaloniki (2023)",
      professionalAthlete: "Professional Athlete",
      professionalDescription: "Professional Muay Thai athlete with experience in high-level competitions",
      coreValues: "Core Values",
      coreValuesDescription: "Our goal is not only physical improvement, but also the cultivation of confidence, character and core values",
      moreThanPhysical: "More Than Physical",
      moreThanPhysicalDesc: "We don't just train bodies. We shape character. Every child is a world in motion, and movement is self-expression, confidence and development.",
      buildingCharacter: "Building Character",
      buildingCharacterDesc: "We teach respect, discipline, perseverance and cooperation. Our goal is to create a school of life where children learn to stand upright physically, mentally and morally.",
      trustTheProcess: "Trust the Process",
      trustTheProcessDesc: "For us, tomorrow starts today. Step by step. With trust in the process. With the courage to go further. With the will to push the limits.",
      trainingMethodologyDescription: "Our training methodology focuses on progressive skill development and reinforcement of proper movement patterns tailored to each individual's needs and goals. Through comprehensive assessment, we understand your current abilities and weaknesses, establish clear training objectives, create a structured timeline for achievement, and design an exclusive personalized training plan specifically for you.",
      movementSkills: "Movement Skills",
      movementSkillsDesc: "Athletic Skills Development\n• Age Appropriate\n• Throwing & Catching, Climbing Skills, Jumping & Landing, Agility Running, Coordination",
      assessment: "Assessment",
      assessmentDesc: "Movement & Posture\n• Load-velocity profile\n• Jump profile\n• Endurance",
      resultsFocused: "Results Focused",
      resultsFocusedDesc: "Results Tracking\n• Performance Guidance\n• Customized Program Development",
      learnMore: "Learn More",
      // New services
      hyperkids: "hyperkids",
      hyperkidsDesc: "Specialized program for children aged 4-12 years focusing on developing fundamental movement skills, coordination and athletic values through fun activities",
      hypergym: "hypergym",
      hypergymDesc: "Modern gym with specialized equipment for strength training, fitness and athletic performance for all ages and levels", 
      hyperathletes: "hyperathletes",
      hyperathletesDesc: "Advanced program for competitive athletes aimed at maximizing performance through personalized training programs and sports psychology"
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'el' ? 'en' : 'el');
  };

  return {
    language,
    translations: translations[language],
    toggleLanguage
  };
};
