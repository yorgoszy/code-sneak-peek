
import React, { useState } from 'react';

interface ResultsSectionProps {
  translations: any;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ translations }) => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      id: 1,
      text: "Trust the process",
      name: "Θωμάς Γιαταγανάς",
      title: "Muay Thai Athlete",
      image: "/lovable-uploads/092dae7d-eb76-4477-ae8f-6d3523f7a1cf.png"
    },
    {
      id: 2,
      text: "Το πρόγραμμα προπόνησης στο Performance άλλαξε εντελώς το παιχνίδι μου. Κέρδισα δύναμη, ταχύτητα και ο χρόνος ανάκαμψής μου βελτιώθηκε σημαντικά.",
      name: "Μάριος Παπαδόπουλος",
      title: "Επαγγελματίας Ποδοσφαιριστής",
      image: "/lovable-uploads/39bb61a5-8dcb-4ba9-8855-8dc0e668ae39.png"
    },
    {
      id: 3,
      text: "Η εξατομικευμένη προσέγγιση και η χρήση τεχνολογίας με βοήθησε να φτάσω στους στόχους μου γρηγορότερα από ποτέ.",
      name: "Ελένη Κωνσταντίνου",
      title: "Ολυμπιονίκης Κολύμβησης",
      image: "/lovable-uploads/39bb61a5-8dcb-4ba9-8855-8dc0e668ae39.png"
    }
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section id="results" className="py-20 bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Robert, sans-serif' }}>
            Αποτελέσματα Αθλητών
          </h2>
          <div className="w-16 h-1 bg-[#00ffba] mx-auto mb-6"></div>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Μην παίρνετε μόνο τον δικό μας λόγο. Ακούστε από τους αθλητές που έχουν βιώσει τη διαφορά του Performance.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20">
          {/* Profile Image */}
          <div className="relative">
            <div className="w-72 h-72 rounded-full border-4 border-[#00ffba] p-2">
              <img 
                src={testimonials[currentTestimonial].image}
                alt={testimonials[currentTestimonial].name}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>

          {/* Testimonial Content */}
          <div className="max-w-2xl text-center lg:text-left">
            <blockquote className="text-xl lg:text-2xl italic mb-8 leading-relaxed">
              "{testimonials[currentTestimonial].text}"
            </blockquote>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Robert, sans-serif' }}>
                {testimonials[currentTestimonial].name}
              </h3>
              <p className="text-[#00ffba] text-lg">
                {testimonials[currentTestimonial].title}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Dots */}
        <div className="flex justify-center mt-12 space-x-3">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentTestimonial(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentTestimonial ? 'bg-[#00ffba]' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Navigation Arrows (hidden on mobile) */}
        <div className="hidden lg:flex justify-between items-center absolute left-4 right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <button
            onClick={prevTestimonial}
            className="pointer-events-auto bg-[#00ffba] text-black p-3 rounded-full hover:bg-[#00cc96] transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextTestimonial}
            className="pointer-events-auto bg-[#00ffba] text-black p-3 rounded-full hover:bg-[#00cc96] transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default ResultsSection;
