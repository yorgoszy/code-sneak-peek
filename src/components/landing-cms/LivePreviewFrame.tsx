import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

interface Props {
  device: PreviewDevice;
  onSelectSection?: (sectionKey: string) => void;
  reloadToken: number;
  lang: 'el' | 'en';
}

// Fixed virtual viewports — guarantees the preview matches the rendered site at those breakpoints.
const sizes: Record<PreviewDevice, { w: number; h: number }> = {
  desktop: { w: 1440, h: 900 },
  tablet:  { w: 768,  h: 1024 },
  mobile:  { w: 390,  h: 844 },
};

export const LivePreviewFrame: React.FC<Props> = ({ device, onSelectSection, reloadToken, lang }) => {
  const ref = useRef<HTMLIFrameElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const size = sizes[device];
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'landing-editor-select' && typeof e.data.key === 'string') {
        onSelectSection?.(e.data.key);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onSelectSection]);

  // Fit-to-container scale (never upscales above 1).
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const compute = () => {
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      const sx = cw / size.w;
      const sy = ch / size.h;
      setScale(Math.min(1, sx, sy));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [size.w, size.h]);

  // Force reload when reloadToken changes
  useEffect(() => {
    if (!ref.current) return;
    ref.current.src = ref.current.src; // eslint-disable-line no-self-assign
  }, [reloadToken]);

  return (
    <div
      ref={wrapRef}
      className="w-full h-full flex items-start justify-center bg-muted overflow-hidden p-2"
    >
      <div
        style={{
          width: size.w * scale,
          height: size.h * scale,
        }}
      >
        <iframe
          ref={ref}
          title="Landing preview"
          src={`/?editor=1&lang=${lang}`}
          style={{
            width: size.w,
            height: size.h,
            background: 'white',
            border: 0,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            display: 'block',
          }}
        />
      </div>
    </div>
  );
};
