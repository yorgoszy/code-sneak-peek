import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Menu, X, User, Globe, ChevronLeft, ChevronRight, MapPin, Phone, Mail, Facebook, Instagram, Youtube } from "lucide-react";
import { useForm } from "react-hook-form";

const Index = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentProgram, setCurrentProgram] = useState(0);
  const [activeAboutSection, setActiveAboutSection] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [language, setLanguage] = useState<'el' | 'en'>('el');

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: ""
    }
  });

  const onSubmit = (data: any) => {
    console.log(data);
    // Handle form submission
  };

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

  const testimonials = {
    el: [
      {
        id: 0,
        quote: "Το πρόγραμμα προπόνησης στο Performance έχει μεταμορφώσει εντελώς το παιχνίδι μου. Κέρδισα δύναμη, ταχύτητα, και ο χρόνος ανάρρωσής μου βελτιώθηκε σημαντικά.",
        name: "Αλέξανδρος Ιωάννου",
        title: "Επαγγελματίας Παίκτης Μπάσκετ",
        avatar: "/lovable-uploads/5fe4260b-05f2-4c12-b877-785e6e657afc.png"
      },
      {
        id: 1,
        quote: "Η μεθοδολογία προπόνησης και η εξατομικευμένη προσέγγιση με βοήθησαν να ξεπεράσω τα όριά μου και να φτάσω σε νέα επίπεδα απόδοσης.",
        name: "Μαρία Παπαδοπούλου",
        title: "Πρωταθλήτρια Κολύμβησης",
        avatar: "/lovable-uploads/5fe4260b-05f2-4c12-b877-785e6e657afc.png"
      },
      {
        id: 2,
        quote: "Στο Hyperkids μαθαίνουν τα παιδιά όχι μόνο αθλητισμό αλλά και αξίες ζωής. Το περιβάλλον είναι υποστηρικτικό και επαγγελματικό.",
        name: "Γιάννης Κωνσταντίνου",
        title: "Γονέας & Πρώην Αθλητής",
        avatar: "/lovable-uploads/5fe4260b-05f2-4c12-b877-785e6e657afc.png"
      }
    ],
    en: [
      {
        id: 0,
        quote: "The training program at Performance has completely transformed my game. I've gained strength, speed, and my recovery time has improved significantly.",
        name: "Alex Johnson",
        title: "Professional Basketball Player",
        avatar: "/lovable-uploads/5fe4260b-05f2-4c12-b877-785e6e657afc.png"
      },
      {
        id: 1,
        quote: "The training methodology and personalized approach helped me push beyond my limits and reach new levels of performance.",
        name: "Maria Smith",
        title: "Swimming Champion",
        avatar: "/lovable-uploads/5fe4260b-05f2-4c12-b877-785e6e657afc.png"
      },
      {
        id: 2,
        quote: "At Hyperkids, children learn not only sports but also life values. The environment is supportive and professional.",
        name: "John Constantine",
        title: "Parent & Former Athlete",
        avatar: "/lovable-uploads/5fe4260b-05f2-4c12-b877-785e6e657afc.png"
      }
    ]
  };

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
        image: "/lovable-uploads/645bd480-56bf-45e9-8884-7217a30a37ed.png",
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
        image: "/lovable-uploads/645bd480-56bf-45e9-8884-7217a30a37ed.png",
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
        content: "Ο στόχος μας δεν είναι μόνο η φυσική βελτίωση, αλλά και η καλλιέργεια αυτοπεποίθησης, χαρακτήρα και ηθικών αξιών"
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
        content: "• Ανάπτυξη Αθλητικών Δεξιοτήτων\n• Κατάλληλο για την Ηλικία\n• Ρίψοις & Πιασίματα, Δεξιότητες Αναρρίχησης, Άλματα & Προσγειώσεις, Τρεξίματα Ευκινησίας, Συντονισμός"
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
        title: "Athlete Results",
        subtitle: "Don't just take our word for it. Hear from the athletes who have experienced the Performance difference.",
        callToAction: {
          title: "Ready to Elevate Your Performance?",
          subtitle: "Join our community of athletes and start your journey towards peak performance today.",
          button: "GET STARTED"
        }
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
        title: "Athlete Results",
        subtitle: "Don't just take our word for it. Hear from the athletes who have experienced the Performance difference.",
        callToAction: {
          title: "Ready to Elevate Your Performance?",
          subtitle: "Join our community of athletes and start your journey towards peak performance today.",
          button: "GET STARTED"
        }
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

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials[language].length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials[language].length) % testimonials[language].length);
  };

  const currentContent = content[language];
  const currentAboutSections = aboutSections[language];
  const currentMethodologyBoxes = methodologyBoxes[language];
  const currentVisionBoxes = visionBoxes[language];
  const currentMethodologyTrainingBoxes = methodologyTrainingBoxes[language];
  const currentEliteTrainingBoxes = eliteTrainingBoxes[language];
  const currentNavigation = navigation[language];
  const currentTestimonials = testimonials[language];

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
            <div className="lg:col-span-1">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 leading-tight">
                Elite Training Methodology
              </h2>
              
              <div className="w-20 h-1 bg-[#00ffba] mb-8"></div>
              
              <p className="text-gray-600 leading-relaxed mb-8">
                New generation training methodology based on scientific principles.
              </p>

              <div className="space-y-6 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#00ffba] rounded-full"></div>
                  <span className="text-gray-800">Accommodating resistance</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#00ffba] rounded-full"></div>
                  <span className="text-gray-800">Accentuated eccentric loading</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#00ffba] rounded-full"></div>
                  <span className="text-gray-800">Velocity based training</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#00ffba] rounded-full"></div>
                  <span className="text-gray-800">Specific energy system development</span>
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed mb-8">
                We utilize cutting-edge technology to track performance metrics in real-
                time, allowing for precise adjustments and optimal training outcomes.
              </p>
            </div>

            {/* Right Side - Image with Overlay Box */}
            <div className="lg:col-span-1 relative">
              <div className="relative overflow-visible">
                <img
                  src="/lovable-uploads/2857cb9c-1d26-4d2c-bba4-ab3c1320b791.png"
                  alt="Advanced Technology"
                  className="w-full h-auto rounded-lg"
                />
                {/* Green Box Overlay - positioned at bottom left, half extending outside */}
                <div className="absolute -bottom-8 -left-12 bg-[#00ffba] text-black p-6 rounded-sm max-w-xs z-10">
                  <h4 className="font-bold text-lg mb-4">Advanced Technology</h4>
                  <p className="text-sm leading-relaxed">
                    Real-time performance tracking for
                    optimal results
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Results Section with Testimonials */}
      <section id="results" className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {currentContent.results.title}
          </h2>
          <p className="text-xl text-gray-300 mb-16 max-w-3xl mx-auto">
            {currentContent.results.subtitle}
          </p>
          
          {/* Testimonial Slider */}
          <div className="relative max-w-4xl mx-auto mb-24">
            <div className="bg-black rounded-lg p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-[#00ffba] overflow-hidden">
                    <img
                      src={currentTestimonials[currentTestimonial].avatar}
                      alt={currentTestimonials[currentTestimonial].name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 text-left">
                  <blockquote className="text-lg md:text-xl text-white mb-6 leading-relaxed italic">
                    "{currentTestimonials[currentTestimonial].quote}"
                  </blockquote>
                  <div>
                    <div className="text-white font-bold text-lg mb-1">
                      {currentTestimonials[currentTestimonial].name}
                    </div>
                    <div className="text-[#00ffba] text-sm">
                      {currentTestimonials[currentTestimonial].title}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Navigation Arrows */}
            <div className="absolute top-1/2 -translate-y-1/2 -left-16 right-0 flex justify-between pointer-events-none">
              <button
                onClick={prevTestimonial}
                className="w-12 h-12 border border-gray-600 rounded-none flex items-center justify-center hover:border-[#00ffba] transition-colors pointer-events-auto"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextTestimonial}
                className="w-12 h-12 border border-gray-600 rounded-none flex items-center justify-center hover:border-[#00ffba] transition-colors pointer-events-auto"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            
            {/* Dots Indicator */}
            <div className="flex justify-center mt-8 gap-2">
              {currentTestimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    currentTestimonial === index ? 'bg-[#00ffba]' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-12 bg-[#00ffba]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
            {currentContent.results.callToAction.title}
          </h2>
          <p className="text-lg text-black mb-6 max-w-2xl mx-auto">
            {currentContent.results.callToAction.subtitle}
          </p>
          <Button size="lg" className="bg-transparent border-2 border-black hover:bg-black hover:text-[#00ffba] text-black font-semibold text-lg px-8 py-4 rounded-none transition-colors">
            {currentContent.results.callToAction.button}
          </Button>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
              Contact
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-12 mb-16">
            {/* Contact Information */}
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 text-[#00ffba] mt-1">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-gray-300">ag.georgiou 46, thessaloniki 54627</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 text-[#00ffba] mt-1">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-gray-300">+30 2310 529104</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 text-[#00ffba] mt-1">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-gray-300">info@hyperkids.gr</p>
                </div>
              </div>

              {/* Social Media Icons */}
              <div className="flex gap-4 pt-4">
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#00ffba] hover:text-black transition-colors cursor-pointer">
                  <Facebook className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#00ffba] hover:text-black transition-colors cursor-pointer">
                  <Instagram className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#00ffba] hover:text-black transition-colors cursor-pointer">
                  <Youtube className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Your name" 
                              {...field} 
                              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 rounded-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="Your email" 
                              {...field} 
                              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 rounded-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Phone</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Your phone number" 
                            {...field} 
                            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 rounded-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Your message" 
                            rows={6}
                            {...field} 
                            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 rounded-none resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full bg-[#00ffba] hover:bg-[#00e6a8] text-black font-semibold text-lg py-4 rounded-none"
                  >
                    Send Message
                  </Button>
                </form>
              </Form>
            </div>
          </div>

          {/* Hours Section */}
          <div className="border-t border-gray-800 pt-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold text-white mb-8">Hours</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Monday - Friday:</span>
                    <span className="text-white">7:00 - 22:00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Saturday:</span>
                    <span className="text-white">Closed</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Sunday:</span>
                    <span className="text-white">Closed</span>
                  </div>
                </div>
              </div>

              {/* Google Maps */}
              <div className="h-64 bg-gray-800 rounded-lg overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3048.4!2d22.94!3d40.64!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDM4JzI2LjQiTiAyMsKwNTYnMjQuMCJF!5e0!3m2!1sen!2sgr!4v1000000000000!5m2!1sen!2sgr"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Hyperkids Location"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">&copy; 2023 hyperkids. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
