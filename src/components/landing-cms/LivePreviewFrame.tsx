import React, { useEffect, useRef } from 'react';

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

interface Props {
  device: PreviewDevice;
  onSelectSection?: (sectionKey: string) => void;
  reloadToken: number;
  lang: 'el' | 'en';
}

const sizes: Record<PreviewDevice, { w: number | string; h: string }> = {
  desktop: { w: '100%', h: '100%' },
  tablet:  { w: 768,    h: '100%' },
  mobile:  { w: 390,    h: '100%' },
};

export const LivePreviewFrame: React.FC<Props> = ({ device, onSelectSection, reloadToken, lang }) => {
  const ref = useRef<HTMLIFrameElement>(null);
  const size = sizes[device];

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'landing-editor-select' && typeof e.data.key === 'string') {
        onSelectSection?.(e.data.key);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onSelectSection]);

  // Force reload when reloadToken changes
  useEffect(() => {
    if (!ref.current) return;
    ref.current.src = ref.current.src; // eslint-disable-line no-self-assign
  }, [reloadToken]);

  return (
    <div className="w-full h-full flex items-start justify-center bg-muted overflow-auto">
      <iframe
        ref={ref}
        title="Landing preview"
        src={`/?editor=1&lang=${lang}`}
        style={{ width: size.w, height: size.h, minHeight: '100%', background: 'white' }}
        className="border-0"
      />
    </div>
  );
};
