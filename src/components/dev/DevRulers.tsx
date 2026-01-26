import React, { useState, useEffect, useRef } from 'react';

interface SectionInfo {
  id: string;
  name: string;
  top: number;
  height: number;
}

const DevRulers: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [sections, setSections] = useState<SectionInfo[]>([]);
  const [currentSection, setCurrentSection] = useState<SectionInfo | null>(null);
  const [relativeY, setRelativeY] = useState(0);

  // Define sections with their IDs and display names
  const sectionDefinitions = [
    { selector: '#home, [class*="HeroSection"], section:first-of-type', name: 'Hero' },
    { selector: '#programs', name: 'Programs (#1)' },
    { selector: 'section.relative.bg-black.min-h-\\[700px\\]:nth-of-type(2)', name: 'Training (#2)' },
  ];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY + window.scrollY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    // Detect sections on the page
    const detectSections = () => {
      const container = document.querySelector('.min-h-screen');
      if (!container) return;

      const allSections = container.querySelectorAll('section, nav');
      const detected: SectionInfo[] = [];
      let sectionNumber = 0;

      allSections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        
        let name = '';
        const id = section.getAttribute('id');
        
        if (section.tagName === 'NAV') {
          name = 'Navigation';
        } else if (id === 'home') {
          name = 'Hero';
        } else if (id === 'programs') {
          sectionNumber++;
          name = `Services (#${sectionNumber})`;
        } else if (id === 'about') {
          sectionNumber++;
          name = `About (#${sectionNumber})`;
        } else if (id === 'blog') {
          sectionNumber++;
          name = `Blog (#${sectionNumber})`;
        } else if (id === 'results') {
          sectionNumber++;
          name = `Results (#${sectionNumber})`;
        } else if (id === 'footer') {
          name = 'Footer';
        } else {
          sectionNumber++;
          name = `Section #${sectionNumber}`;
        }

        detected.push({
          id: id || `section-${index}`,
          name,
          top,
          height: rect.height
        });
      });

      setSections(detected);
    };

    handleResize();
    handleScroll();
    
    // Delay section detection to ensure DOM is ready
    setTimeout(detectSections, 500);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    window.addEventListener('resize', detectSections);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', detectSections);
    };
  }, []);

  // Update current section based on mouse position
  useEffect(() => {
    const absoluteY = mousePos.y;
    
    let foundSection: SectionInfo | null = null;
    for (const section of sections) {
      if (absoluteY >= section.top && absoluteY < section.top + section.height) {
        foundSection = section;
        break;
      }
    }

    setCurrentSection(foundSection);
    if (foundSection) {
      setRelativeY(Math.round(absoluteY - foundSection.top));
    }
  }, [mousePos.y, sections]);

  // Calculate page height for vertical ruler
  const pageHeight = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
    windowSize.height
  );

  // Generate tick marks for horizontal ruler
  const horizontalTicks = [];
  for (let i = 0; i <= windowSize.width; i += 50) {
    horizontalTicks.push(
      <div key={`h-${i}`} className="absolute flex flex-col items-center" style={{ left: i }}>
        <div className="h-3 w-px bg-white/70" />
        {i % 100 === 0 && (
          <span className="text-[8px] text-white/70 mt-0.5">{i}</span>
        )}
      </div>
    );
  }

  // Generate tick marks for vertical ruler (full page)
  const verticalTicks = [];
  const visibleStart = scrollY;
  const visibleEnd = scrollY + windowSize.height;
  
  // Only render ticks that are visible
  const tickStart = Math.floor(visibleStart / 50) * 50;
  const tickEnd = Math.ceil(visibleEnd / 50) * 50;
  
  for (let i = tickStart; i <= tickEnd; i += 50) {
    verticalTicks.push(
      <div 
        key={`v-${i}`} 
        className="absolute flex items-center" 
        style={{ top: i - scrollY }}
      >
        <div className="w-3 h-px bg-white/70" />
        {i % 100 === 0 && (
          <span className="text-[8px] text-white/70 ml-1">{i}</span>
        )}
      </div>
    );
  }

  // Generate section markers for vertical ruler
  const sectionMarkers = sections.map((section) => {
    const markerTop = section.top - scrollY;
    // Only show if visible
    if (markerTop < -20 || markerTop > windowSize.height) return null;
    
    return (
      <div 
        key={section.id}
        className="absolute left-0 right-0 flex items-center"
        style={{ top: markerTop }}
      >
        <div className="w-full h-0.5 bg-[#00ffba]" />
        <span className="absolute left-10 text-[9px] text-[#00ffba] font-bold whitespace-nowrap bg-black/80 px-1">
          {section.name} (Y:0)
        </span>
      </div>
    );
  });

  return (
    <>
      {/* Horizontal ruler (top) */}
      <div className="fixed top-0 left-0 right-0 h-6 bg-black/80 z-[9999] pointer-events-none">
        {horizontalTicks}
      </div>

      {/* Vertical ruler (left - full page) */}
      <div className="fixed top-0 left-0 bottom-0 w-8 bg-black/80 z-[9999] pointer-events-none overflow-hidden">
        {verticalTicks}
        {sectionMarkers}
      </div>

      {/* Mouse position indicator with section info */}
      <div className="fixed bottom-4 left-12 bg-black/90 text-white px-3 py-2 z-[9999] text-sm font-mono pointer-events-none rounded-none">
        <div>X: {mousePos.x}px</div>
        <div className="text-[#00ffba]">
          {currentSection ? (
            <>
              Y: {relativeY}px <span className="text-white/60">({currentSection.name})</span>
            </>
          ) : (
            <>Y: {mousePos.y}px (Global)</>
          )}
        </div>
      </div>

      {/* Crosshair lines */}
      <div 
        className="fixed top-0 w-px h-full bg-red-500/50 z-[9998] pointer-events-none"
        style={{ left: mousePos.x }}
      />
      <div 
        className="fixed left-0 h-px w-full bg-red-500/50 z-[9998] pointer-events-none"
        style={{ top: mousePos.y - scrollY }}
      />
    </>
  );
};

export default DevRulers;
