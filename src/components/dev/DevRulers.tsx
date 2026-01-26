import React, { useState, useEffect } from 'react';

const DevRulers: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    handleResize();
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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

  // Generate tick marks for vertical ruler
  const verticalTicks = [];
  for (let i = 0; i <= windowSize.height; i += 50) {
    verticalTicks.push(
      <div key={`v-${i}`} className="absolute flex items-center" style={{ top: i }}>
        <div className="w-3 h-px bg-white/70" />
        {i % 100 === 0 && (
          <span className="text-[8px] text-white/70 ml-1">{i}</span>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Horizontal ruler (top) */}
      <div className="fixed top-0 left-0 right-0 h-6 bg-black/80 z-[9999] pointer-events-none">
        {horizontalTicks}
      </div>

      {/* Vertical ruler (right) */}
      <div className="fixed top-0 right-0 bottom-0 w-8 bg-black/80 z-[9999] pointer-events-none">
        {verticalTicks}
      </div>

      {/* Mouse position indicator */}
      <div className="fixed bottom-4 left-4 bg-black/90 text-white px-3 py-2 rounded z-[9999] text-sm font-mono pointer-events-none">
        X: {mousePos.x}px | Y: {mousePos.y}px
      </div>

      {/* Crosshair lines */}
      <div 
        className="fixed top-0 w-px h-full bg-red-500/50 z-[9998] pointer-events-none"
        style={{ left: mousePos.x }}
      />
      <div 
        className="fixed left-0 h-px w-full bg-red-500/50 z-[9998] pointer-events-none"
        style={{ top: mousePos.y }}
      />
    </>
  );
};

export default DevRulers;
