
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Menu, X, User, Globe, ChevronLeft, ChevronRight } from "lucide-react";

const Index = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentProgram, setCurrentProgram] = useState(0);
  const [activeAboutSection, setActiveAboutSection] = useState(0);
  const [language, setLanguage] = useState<'el' | 'en'>('el');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'el' ? 'en' : 'el');
  };

  const programs = [
    {
      id: "01",
      title: "Εκμάθηση Κίνησης",
      description: "Εισαγωγικές τεχνικές κίνησης",
      image: "/lovable-uploads/12fd681e-290f-4ce8-a035-32501adf2034.png"
    },
    {
      id: "02", 
      title: "Ανάπτυξη Κίνησης",
      description: "Δημιουργία αθλητικών βάσεων για όλα τα αθλήματα",
      image: "/lovable-uploads/9d74fc2b-b9ee-4272-9a0e-9f5a3d7d29f4.png"
    },
    {
      id: "03",
      title: "Δύναμη Νέων", 
      description: "Προπτωμένες τεχνικές και φυσική κατάσταση",
      image: "/lovable-uploads/29ceb456-3fe1-4f11-82f7-f66e683312bb.png"
    },
    {
      id: "04",
      title: "Φυσική Κατάσταση",
      description: "Εξατομικευμένες λύσεις φυσικής κατάστασης για όλα τα επίπεδα",
      image: "/lovable-uploads/100152b9-0727-459b-b2b6-e6614fe8c730.png"
    },
    {
      id: "05",
      title: "Muay Thai",
      description: "Μέθοδοι Προπόνησης Νέων Γενιές",
      image: "/lovable-uploads/59a5eb9c-a6d9-4195-bc4c-bee6f5ce513c.png"
    },
    {
      id: "06",
      title: "Ατομική Προπόνηση",
      description: "Εξατομικευμένη καθοδήγηση για μέγιστα αποτελέσματα",
      image: "/lovable-uploads/85436038-48ee-42f9-a2e6-d13a75dd8d52.png"
    },
    {
      id: "07",
      title: "Αθλητική Απόδοση",
      description: "Στρατηγικές Ελίτ Δύναμης & Φυσικής Κατάστασης",
      image: "/lovable-uploads/77591c7f-20d5-4ab2-ab03-5ae09f70daf5.png"
    }
  ];

  const aboutSections = {
    el: [
      {
        id: 0,
        title: "Κύριος Προπονητής",
        number: "01",
        image: "/lovable-uploads/33655c97-0bc0-4a99-b492-8f0fa441437f.png",
        content: "Το όνομά μου είναι Γιώργος Ζυγούρης και είμαι απόφοιτος της Σχολής Φυσικής Αγωγής και Αθλητισμού του Αριστοτελείου Πανεπιστημίου Θεσσαλονίκης (2023). Είμαι επαγγελματίας αθλητής Muay Thai και πιστοποιημένος προπονητής από το 2024. Μέσα από τη διπλή μου οπτική ως αγωνιστής και εκπαιδευτικός, έχω δημιουργήσει ένα περιβάλλον προπόνησης όπου παιδιά, έφηβοι και ενήλικες δεν μαθαίνουν απλώς κίνηση—ανακαλύπτουν τις δυνάμεις τους, χτίζουν χαρακτήρα μέσω του αθλητισμού και βρίσκουν τη μοναδική τους θέση στον αθλητικό κόσμο."
      },
      {
        id: 1,
        title: "Το Όραμά μας",
        number: "02",
        image: "/lovable-uploads/81100ffe-6e78-4faa-a6f7-46163c4fdc57.png",
        content: "Συνδυάζοντας επιστημονική γνώση με πραγματική εμπειρία, εφαρμόζουμε ανάπτυξη δεξιοτήτων και προπόνηση εστιασμένη στην απόδοση, προσαρμοσμένη σε κάθε ηλικία και στάδιο. Βλέπουμε την κίνηση ως κάτι περισσότερο από φυσικό — είναι αυτοέκφραση, αυτοπεποίθηση και η δύναμη να μεγαλώνουμε μέσα από την πρόκληση. Η αποστολή μας είναι να βοηθήσουμε τους νέους να εμπιστευτούν τη διαδικασία και να εξερευνήσουν τις δυνατότητές τους σε έναν ασφαλή, υποστηρικτικό χώρο."
      },
      {
        id: 2,
        title: "Μεθοδολογία Προπόνησης",
        number: "03",
        image: "/lovable-uploads/e7b26f7e-bacc-4b5e-b03d-39786bb57f6c.png",
        content: "Η μεθοδολογία προπόνησής μας εστιάζει στην προοδευτική ανάπτυξη δεξιοτήτων και την ενίσχυση των σωστών κινητικών προτύπων προσαρμοσμένων στις ανάγκες και στόχους κάθε ατόμου. Μέσω ολοκληρωμένης αξιολόγησης, κατανοούμε τις τρέχουσες ικανότητες και αδυναμίες σας, καθορίζουμε σαφείς στόχους προπόνησης, δημιουργούμε ένα δομημένο χρονοδιάγραμμα για την επίτευξη και σχεδιάζουμε ένα αποκλειστικό εξατομικευμένο πρόγραμμα προπόνησης ειδικά για εσάς."
      },
      {
        id: 3,
        title: "Elite Training Methodology",
        number: "04",
        image: "/lovable-uploads/97800d53-e9d6-4b5d-876a-69015555d90b.png",
        content: "Η μεθοδολογία προπόνησής μας βασίζεται σε επιστημονικές αρχές και χρόνια εμπειρίας εργασίας με ελίτ αθλητές. Εστιάζουμε στην ανάπτυξη όλων των πτυχών της αθλητικής απόδοσης συμπεριλαμβανομένων: Κινητικότητας & Ευελιξίας, Ταχύτητας & Ευκινησίας, Δύναμης & Ισχύος, Αντοχής & Αντοχής. Χρησιμοποιούμε προηγμένη τεχνολογία για την παρακολούθηση των μετρήσεων απόδοσης σε πραγματικό χρόνο, επιτρέποντας ακριβείς προσαρμογές και βέλτιστα αποτελέσματα προπόνησης."
      }
    ],
    en: [
      {
        id: 0,
        title: "Head Coach",
        number: "01",
        image: "/lovable-uploads/33655c97-0bc0-4a99-b492-8f0fa441437f.png",
        content: "My name is Georgios Zygouris, and I am a graduate of the School of Physical Education and Sport Science at the Aristotle University of Thessaloniki (2023). I am a professional Muay Thai athlete and a certified coach since 2024. Through my dual perspective as both competitor and educator, I've established a training environment where children, teenagers, and adults don't just learn movement, they discover their strengths, build character through sport, and find their unique position in the athletic world."
      },
      {
        id: 1,
        title: "Our Vision",
        number: "02",
        image: "/lovable-uploads/81100ffe-6e78-4faa-a6f7-46163c4fdc57.png",
        content: "Combining scientific knowledge with real-world experience, we apply skill development and performance-focused training tailored to each age and stage. We see movement as more than physical — it's self-expression, confidence, and the power to grow through challenge. Our mission is to help young people trust the process and explore their potential in a safe, supportive space."
      },
      {
        id: 2,
        title: "Training Methodology",
        number: "03",
        image: "/lovable-uploads/e7b26f7e-bacc-4b5e-b03d-39786bb57f6c.png",
        content: "Our training methodology focuses on progressive skill development and reinforcement of proper movement patterns tailored to each individual's needs and goals. Through comprehensive assessment, we understand your current abilities and weaknesses, establish clear training objectives, create a structured timeline for achievement, and design an exclusive personalized training plan specifically for you."
      },
      {
        id: 3,
        title: "Elite Training Methodology",
        number: "04",
        image: "/lovable-uploads/97800d53-e9d6-4b5d-876a-69015555d90b.png",
        content: "Our training methodology is based on scientific principles and years of experience working with elite athletes. We focus on developing all aspects of athletic performance including: Mobility & Flexibility, Speed & Agility, Strength & Power, Endurance & Stamina. We utilize cutting-edge technology to track performance metrics in real-time, allowing for precise adjustments and optimal training outcomes."
      }
    ]
  };

  const methodologyBoxes = {
    el: [
      {
        title: "Ακαδημαϊκό Υπόβαθρο",
        content: "Απόφοιτος της Σχολής Φυσικής Αγωγής και Αθλητισμού του Αριστοτελείου Πανεπιστημίου Θεσσαλονίκης (2023)"
      },
      {
        title: "Επαγγελματίας Αθλητής",
        content: "Επαγγελματίας αθλητής Muay Thai με εμπειρία σε αγώνες υψηλού επιπέδου"
      },
      {
        title: "Βασικές Αξίες",
        content: "Ο στόχος μας δεν είναι μόνο η φυσική βελτίωση, αλλά και η καλλιέργεια αυτοπεποίθησης, χαρακτήρα και θετικών αξιών"
      }
    ],
    en: [
      {
        title: "Academic Background",
        content: "Graduate of the School of Physical Education and Sport Science at the Aristotle University of Thessaloniki (2023)"
      },
      {
        title: "Professional Athlete",
        content: "Professional Muay Thai athlete with experience in high-level competitions"
      },
      {
        title: "Core Values",
        content: "Our goal is not only physical improvement, but also the cultivation of confidence, character and positive values"
      }
    ]
  };

  const visionBoxes = {
    el: [
      {
        title: "Περισσότερο από Φυσικό",
        content: "Δεν προπονούμε απλώς σώματα. Διαμορφώνουμε χαρακτήρα. Κάθε παιδί είναι ένας κόσμος σε κίνηση, και η κίνηση είναι αυτοέκφραση, αυτοπεποίθηση και ανάπτυξη."
      },
      {
        title: "Χτίσιμο Χαρακτήρα",
        content: "Διδάσκουμε σεβασμό, πειθαρχία, επιμονή και συνεργασία. Στόχος μας είναι να δημιουργήσουμε ένα σχολείο ζωής όπου τα παιδιά μαθαίνουν να στέκονται όρθια φυσικά, ψυχικά και ηθικά."
      },
      {
        title: "Εμπιστοσύνη στη Διαδικασία",
        content: "Για εμάς, το αύριο αρχίζει σήμερα. Βήμα βήμα. Με εμπιστοσύνη στη διαδικασία. Με το κουράγιο να πάμε παραπέρα. Με τη θέληση να ξεπεράσουμε τα όρια."
      }
    ],
    en: [
      {
        title: "More than Physical",
        content: "We don't just train bodies. We shape character. Every child is a world in motion, and movement is self-expression, confidence and development."
      },
      {
        title: "Building Character",
        content: "We teach respect, discipline, perseverance and cooperation. Our goal is to create a school of life where children learn to stand upright physically, mentally and morally."
      },
      {
        title: "Trust the Process",
        content: "For us, tomorrow starts today. Step by step. With trust in the process. With the courage to go further. With the will to push the limits."
      }
    ]
  };

  const methodologyTrainingBoxes = {
    el: [
      {
        title: "Κινητικές Δεξιότητες",
        content: "• Ανάπτυξη Αθλητικών Δεξιοτήτων\n• Κατάλληλο για την Ηλικία\n• Ρίψεις & Πιασίματα, Δεξιότητες Αναρρίχησης, Άλματα & Προσγειώσεις, Τρεξίματα Ευκινησίας, Συντονισμός"
      },
      {
        title: "Αξιολόγηση", 
        content: "• Κίνηση & Στάση\n• Προφίλ φορτίου - ταχύτητας\n• Προφίλ άλματος\n• Αντοχή"
      },
      {
        title: "Εστιασμένα στα Αποτελέσματα",
        content: "• Παρακολούθηση Αποτελεσμάτων\n• Καθοδήγηση Απόδοσης\n• Ανάπτυξη Προσαρμοσμένου Προγράμματος"
      }
    ],
    en: [
      {
        title: "Movement Skills",
        content: "• Athletic Skill Development\n• Age Appropriate\n• Throwing & Catching, Climbing Skills, Jumping & Landing, Agility Running, Coordination"
      },
      {
        title: "Assessment",
        content: "• Movement & Posture\n• Load-velocity profile\n• Jump profile\n• Endurance"
      },
      {
        title: "Results Focused",
        content: "• Results Tracking\n• Performance Guidance\n• Customized Program Development"
      }
    ]
  };

  const eliteTrainingBoxes = {
    el: [
      {
        title: "Προηγμένη Τεχνολογία",
        content: "Παρακολούθηση απόδοσης σε πραγματικό χρόνο για βέλτιστα αποτελέσματα"
      },
      {
        title: "Επιστημονική Προσέγγιση",
        content: "Βασισμένη σε επιστημονικές αρχές και χρόνια εμπειρίας με ελίτ αθλητές"
      },
      {
        title: "Ολοκληρωμένη Ανάπτυξη",
        content: "Εστίαση σε όλες τις πτυχές της αθλητικής απόδοσης"
      }
    ],
    en: [
      {
        title: "Advanced Technology",
        content: "Real-time performance tracking for optimal results"
      },
      {
        title: "Scientific Approach",
        content: "Based on scientific principles and years of experience with elite athletes"
      },
      {
        title: "Comprehensive Development",
        content: "Focus on all aspects of athletic performance"
      }
    ]
  };

  const navigation = {
    el: {
      home: "Αρχή",
      programs: "Προγράμματα", 
      about: "Σχετικά Με Εμάς",
      results: "Αποτελέσματα",
      contact: "Επικοινωνία"
    },
    en: {
      home: "Home",
      programs: "Programs",
      about: "About Us", 
      results: "Results",
      contact: "Contact"
    }
  };

  const content = {
    el: {
      hero: {
        title: "The Champion's Journey",
        subtitle: "Starts Here",
        getStarted: "GET STARTED",
        contact: "CONTACT"
      },
      programs: {
        title: "Εξερεύνησε Όλα Τα",
        subtitle: "Προγράμματα"
      },
      about: {
        subtitle: "ΣΧΕΤΙΚΑ ΜΕ ΕΜΑΣ",
        title: "Supporting Your",
        titleHighlight: "Athletic Journey"
      },
      results: {
        title: "Τα Αποτελέσματά Μας",
        students: "Μαθητές",
        champions: "Πρωταθλητές", 
        experience: "Χρόνια Εμπειρίας",
        dedication: "Αφοσίωση"
      },
      contactSection: {
        title: "Ξεκινήστε Σήμερα",
        description: "Ελάτε να γνωρίσετε το χώρο μας και να ξεκινήσετε το δικό σας ταξίδι προς την κορυφή",
        trial: "Κλείστε Δοκιμαστικό Μάθημα",
        contactUs: "Επικοινωνήστε Μαζί Μας"
      }
    },
    en: {
      hero: {
        title: "The Champion's Journey",
        subtitle: "Starts Here",
        getStarted: "GET STARTED",
        contact: "CONTACT"
      },
      programs: {
        title: "Explore All",
        subtitle: "Programs"
      },
      about: {
        subtitle: "ABOUT US",
        title: "Supporting Your",
        titleHighlight: "Athletic Journey"
      },
      results: {
        title: "Our Results",
        students: "Students",
        champions: "Champions",
        experience: "Years Experience", 
        dedication: "Dedication"
      },
      contactSection: {
        title: "Start Today",
        description: "Come and see our space and start your own journey to the top",
        trial: "Book Trial Class",
        contactUs: "Contact Us"
      }
    }
  };

  const nextProgram = () => {
    setCurrentProgram((prev) => (prev + 1) % programs.length);
  };

  const prevProgram = () => {
    setCurrentProgram((prev) => (prev - 1 + programs.length) % programs.length);
  };

  const currentContent = content[language];
  const currentAboutSections = aboutSections[language];
  const currentMethodologyBoxes = methodologyBoxes[language];
  const currentVisionBoxes = visionBoxes[language];
  const currentMethodologyTrainingBoxes = methodologyTrainingBoxes[language];
  const currentEliteTrainingBoxes = eliteTrainingBoxes[language];
  const currentNavigation = navigation[language];

  return (
    <div className="min-h-screen bg-black text-white font-robert font-medium">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-black/95 backdrop-blur-sm z-50 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img 
                  src="/lovable-uploads/83e3ba31-3c4d-44a1-b842-c9468896e822.png" 
                  alt="HYPERKIDS Logo" 
                  className="h-8 w-auto"
                />
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#home" className="text-white hover:text-[#00ffba] text-sm font-medium transition-colors">
                  {currentNavigation.home}
                </a>
                <a href="#programs" className="text-white hover:text-[#00ffba] text-sm font-medium transition-colors">
                  {currentNavigation.programs}
                </a>
                <a href="#schedule" className="text-white hover:text-[#00ffba] text-sm font-medium transition-colors">
                  {currentNavigation.about}
                </a>
                <a href="#results" className="text-white hover:text-[#00ffba] text-sm font-medium transition-colors">
                  {currentNavigation.results}
                </a>
                <a href="#contact" className="text-white hover:text-[#00ffba] text-sm font-medium transition-colors">
                  {currentNavigation.contact}
                </a>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Globe 
                className="h-6 w-6 text-white hover:text-[#00ffba] cursor-pointer transition-colors" 
                onClick={toggleLanguage}
              />
              <User className="h-6 w-6 text-white hover:text-[#00ffba] cursor-pointer transition-colors" />
            </div>
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white"
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 bg-black/95 backdrop-blur-sm border-b border-gray-800 z-40">
          <div className="px-4 py-4 space-y-3">
            <a href="#home" className="block text-white hover:text-[#00ffba] text-sm font-medium">
              {currentNavigation.home}
            </a>
            <a href="#programs" className="block text-white hover:text-[#00ffba] text-sm font-medium">
              {currentNavigation.programs}
            </a>
            <a href="#schedule" className="block text-white hover:text-[#00ffba] text-sm font-medium">
              {currentNavigation.about}
            </a>
            <a href="#results" className="block text-white hover:text-[#00ffba] text-sm font-medium">
              {currentNavigation.results}
            </a>
            <a href="#contact" className="block text-white hover:text-[#00ffba] text-sm font-medium">
              {currentNavigation.contact}
            </a>
            <div className="pt-4 flex justify-center space-x-4">
              <Globe 
                className="h-6 w-6 text-white hover:text-[#00ffba] cursor-pointer transition-colors" 
                onClick={toggleLanguage}
              />
              <User className="h-6 w-6 text-white hover:text-[#00ffba] cursor-pointer transition-colors" />
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-end pb-32">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/lovable-uploads/b0c1fb65-ea62-4a1d-8cae-3ce536633f96.png')`,
          }}
        >
          <div className="absolute inset-0 bg-black/60"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 text-left px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight font-robert">
            {currentContent.hero.title}
            <br />
            <span style={{ color: '#00ffba' }}>
              {currentContent.hero.subtitle}
            </span>
          </h1>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Button size="lg" className="text-lg px-8 py-4 bg-[#00ffba] hover:bg-[#00e6a8] text-black rounded-none font-roobert-pro-light font-light">
              {currentContent.hero.getStarted}
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4 border-white text-white bg-transparent hover:bg-white/10 rounded-none font-roobert-pro-light font-light">
              {currentContent.hero.contact}
            </Button>
          </div>
        </div>
        
        {/* Scroll Down Indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="text-center flex flex-col items-center">
            <div className="text-sm text-gray-300 mb-2">SCROLL DOWN</div>
            <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-bounce"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-left mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-roobert-pro-light">
              {currentContent.programs.title}
              <br />
              {currentContent.programs.subtitle}
            </h2>
          </div>
          
          <div className="relative">
            {/* Program Numbers Navigation */}
            <div className="flex gap-8 mb-12">
              {programs.map((program, index) => (
                <button
                  key={program.id}
                  onClick={() => setCurrentProgram(index)}
                  className={`text-left transition-colors ${
                    currentProgram === index ? 'text-[#00ffba]' : 'text-gray-500'
                  }`}
                >
                  <div className="text-lg font-bold mb-2">{program.id}</div>
                  <div className="text-sm font-roobert-pro-light">{program.title}</div>
                </button>
              ))}
            </div>

            {/* Carousel Navigation Arrows */}
            <div className="absolute top-0 right-0 flex gap-4">
              <button
                onClick={prevProgram}
                className="w-12 h-12 border border-gray-600 rounded-none flex items-center justify-center hover:border-[#00ffba] transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextProgram}
                className="w-12 h-12 border border-gray-600 rounded-none flex items-center justify-center hover:border-[#00ffba] transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Program Images Grid */}
            <div className="grid grid-cols-4 gap-6 h-96">
              {programs.map((program, index) => (
                <div 
                  key={program.id}
                  className={`relative overflow-hidden transition-all duration-500 ${
                    currentProgram === index ? 'col-span-2' : 'col-span-1'
                  }`}
                >
                  <img
                    src={program.image}
                    alt={program.title}
                    className="w-full h-full object-cover filter grayscale"
                  />
                  <div className="absolute inset-0 bg-black/60"></div>
                  {currentProgram === index && (
                    <div className="absolute bottom-6 left-6 text-white">
                      <p className="text-sm font-roobert-pro-light">{program.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="schedule" className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Side - Content */}
            <div>
              <div className="text-[#00ffba] text-sm font-medium mb-4 tracking-wider">{currentContent.about.subtitle}</div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
                {currentContent.about.title}
                <br />
                <span className="text-[#00ffba]">{currentContent.about.titleHighlight}</span>
              </h2>
              
              <div className="space-y-8">
                {currentAboutSections.map((section, index) => (
                  <div key={section.id} className="flex items-start gap-4">
                    <div className={`font-bold text-xl ${
                      activeAboutSection === index ? 'text-[#00ffba]' : 'text-gray-500'
                    }`}>
                      {section.number}
                    </div>
                    <div className="flex-1">
                      <button
                        onClick={() => setActiveAboutSection(index)}
                        className={`font-semibold text-lg mb-2 text-left hover:text-[#00ffba] transition-colors block w-full ${
                          activeAboutSection === index ? 'text-white' : 'text-gray-500'
                        }`}
                      >
                        {section.title}
                      </button>
                      {activeAboutSection === index && (
                        <div className="w-full h-0.5 bg-[#00ffba] mb-3"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Image and Content */}
            <div className="relative">
              <div className="relative overflow-hidden rounded-lg transition-transform duration-300 hover:scale-105">
                <img
                  src={currentAboutSections[activeAboutSection].image}
                  alt={currentAboutSections[activeAboutSection].title}
                  className="w-full h-auto rounded-lg"
                />
                {/* Section Number and Line overlay inside image - moved to bottom */}
                <div className="absolute bottom-6 left-6 right-6 flex items-center gap-4">
                  <div className="text-[#00ffba] font-bold text-4xl">{currentAboutSections[activeAboutSection].number}</div>
                  <div className="flex-1 h-0.5 bg-[#00ffba]"></div>
                </div>
              </div>
              
              <div className="mt-8">                
                <h3 className="text-2xl font-bold text-white mb-6">{currentAboutSections[activeAboutSection].title}</h3>
                
                <p className="text-gray-300 leading-relaxed mb-8">
                  {currentAboutSections[activeAboutSection].content}
                </p>

                {/* Methodology Boxes - Only show for section 01 */}
                {activeAboutSection === 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {currentMethodologyBoxes.map((box, index) => (
                      <div key={index} className="bg-gray-800/50 p-4 rounded-sm border-l border-l-[#00ffba]">
                        <h4 className="text-white font-semibold text-sm mb-3">{box.title}</h4>
                        <p className="text-[#9ca3ad] text-sm leading-relaxed">{box.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Vision Boxes - Only show for section 02 */}
                {activeAboutSection === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {currentVisionBoxes.map((box, index) => (
                      <div key={index} className="bg-gray-800/50 p-4 rounded-sm border-l border-l-[#00ffba]">
                        <h4 className="text-white font-semibold text-sm mb-3">{box.title}</h4>
                        <p className="text-[#9ca3ad] text-sm leading-relaxed">{box.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Methodology Training Boxes - Only show for section 03 */}
                {activeAboutSection === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {currentMethodologyTrainingBoxes.map((box, index) => (
                      <div key={index} className="bg-gray-800/50 p-4 rounded-sm border-l border-l-[#00ffba]">
                        <h4 className="text-white font-semibold text-sm mb-3">{box.title}</h4>
                        <div className="text-[#9ca3ad] text-sm leading-relaxed whitespace-pre-line">{box.content}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Elite Training Boxes - Only show for section 04 */}
                {activeAboutSection === 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {currentEliteTrainingBoxes.map((box, index) => (
                      <div key={index} className="bg-gray-800/50 p-4 rounded-sm border-l border-l-[#00ffba]">
                        <h4 className="text-white font-semibold text-sm mb-3">{box.title}</h4>
                        <p className="text-[#9ca3ad] text-sm leading-relaxed">{box.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Elite Training Methodology Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Side - Content */}
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 leading-tight">
                Elite Training Methodology
              </h2>
              
              <div className="w-20 h-1 bg-[#00ffba] mb-8"></div>
              
              <p className="text-gray-600 leading-relaxed mb-8">
                Our training methodology is based on scientific principles and years of
                experience working with elite athletes. We focus on developing all
                aspects of athletic performance including:
              </p>

              <div className="space-y-6 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#00ffba] rounded-full"></div>
                  <span className="text-gray-800">Mobility & Flexibility</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#00ffba] rounded-full"></div>
                  <span className="text-gray-800">Speed & Agility</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#00ffba] rounded-full"></div>
                  <span className="text-gray-800">Strength & Power</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#00ffba] rounded-full"></div>
                  <span className="text-gray-800">Endurance & Stamina</span>
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed mb-8">
                We utilize cutting-edge technology to track performance metrics in real-
                time, allowing for precise adjustments and optimal training outcomes.
              </p>

              <Button className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-none font-roobert-pro-light">
                OUR APPROACH
              </Button>
            </div>

            {/* Right Side - Image and Technology Box */}
            <div className="relative">
              <img
                src="/lovable-uploads/ab580f0e-bafb-4ea0-8ea3-b88c94787221.png"
                alt="Advanced Technology"
                className="w-full h-auto rounded-lg"
              />
              
              {/* Advanced Technology Overlay */}
              <div className="absolute bottom-6 right-6 bg-[#00ffba] text-black p-4 rounded-sm max-w-xs">
                <h4 className="font-bold text-sm mb-2">Advanced Technology</h4>
                <p className="text-xs">
                  Real-time performance tracking for
                  optimal results
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section id="results" className="py-24 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-16">
            {currentContent.results.title}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-6xl font-bold text-[#00ffba] mb-2">500+</div>
              <div className="text-gray-300">{currentContent.results.students}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-6xl font-bold text-[#00ffba] mb-2">50+</div>
              <div className="text-gray-300">{currentContent.results.champions}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-6xl font-bold text-[#00ffba] mb-2">10</div>
              <div className="text-gray-300">{currentContent.results.experience}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-6xl font-bold text-[#00ffba] mb-2">100%</div>
              <div className="text-gray-300">{currentContent.results.dedication}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-black">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            {currentContent.contactSection.title}
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            {currentContent.contactSection.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-[#00ffba] hover:bg-[#00e6a8] text-black font-semibold text-lg px-8 py-4 rounded-none font-roobert-light font-light">
              {currentContent.contactSection.trial}
            </Button>
            <Button variant="outline" size="lg" className="border-white text-white bg-transparent hover:bg-white/10 text-lg px-8 py-4 rounded-none font-roobert-light font-light">
              {currentContent.contactSection.contactUs}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold mb-4">HYPERKIDS</div>
              <p className="text-gray-400 mb-6">
                Δημιουργώντας πρωταθλητές για το μέλλον
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-lg">Επικοινωνία</h3>
              <div className="space-y-2 text-gray-400">
                <p>Διεύθυνση: Κεντρική 123, Αθήνα</p>
                <p>Τηλέφωνο: +30 210 123 4567</p>
                <p>Email: info@hyperkids.gr</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-lg">Ωράριο</h3>
              <div className="space-y-2 text-gray-400">
                <p>Δευτέρα - Παρασκευή: 06:00 - 22:00</p>
                <p>Σάββατο: 08:00 - 20:00</p>
                <p>Κυριακή: 10:00 - 18:00</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2024 HYPERKIDS. Όλα τα δικαιώματα κατοχυρωμένα.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
