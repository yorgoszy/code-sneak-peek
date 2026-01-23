import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import heroSlide1 from '@/assets/hero-slide-1.svg';
import heroSlide2 from '@/assets/hero-slide-2.svg';
import heroSlide3 from '@/assets/hero-slide-3.svg';

interface HeroSectionProps {
  translations: any;
  onGetStarted: () => void;
}

const slides = [
  { image: heroSlide1, alt: 'Slide 1' },
  { image: heroSlide2, alt: 'Slide 2' },
  { image: heroSlide3, alt: 'Slide 3' },
];

const HeroSection: React.FC<HeroSectionProps> = ({ translations, onGetStarted }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, duration: 30 },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  return (
    <section id="home" className="relative min-h-screen overflow-hidden">
      <div className="embla h-screen" ref={emblaRef}>
        <div className="embla__container flex h-full">
          {slides.map((slide, index) => (
            <div key={index} className="embla__slide flex-[0_0_100%] min-w-0 relative">
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${slide.image})` }}
              />
            </div>
          ))}
        </div>
      </div>

    </section>
  );
};

export default HeroSection;
