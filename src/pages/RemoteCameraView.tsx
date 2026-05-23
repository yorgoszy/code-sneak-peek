import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BlueSlider } from '@/components/ui/blue-slider';
import {
  Focus, Aperture, Thermometer, Gauge, Maximize2, Minimize2, Loader2, WifiOff,
  Sun, Cloud, CloudSun, Lightbulb, Zap, Home, RefreshCw,
} from 'lucide-react';
import {
  startViewerSession,
  type ViewerSession,
  type RemoteState,
} from '@/lib/blackmagicRemoteSession';

type WebkitFullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type WebkitFullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type StandaloneNavigator = Navigator & { standalone?: boolean };

const ISO_STEPS = [
  100, 125, 160, 200, 250, 320, 400, 500, 640, 800, 1000, 1250,
  1600, 2000, 2500, 3200, 4000, 5000, 6400, 8000, 10000, 12800,
  16000, 20000, 25600,
];

const snapIso = (val: number) =>
  ISO_STEPS.reduce((prev, curr) => (Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev));

const getNativeIsos = (name?: string | null): number[] => {
  const n = (name || '').toLowerCase();
  if (/ursa.*(mini pro)?\s*12k|pyxis\s*12k/.test(n)) return [800, 3200];
  if (/studio|broadcast/.test(n)) return [400];
  return [400, 3200];
};

const RemoteCameraView: React.FC = () => {
  const { sessionId = '' } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionRef = useRef<ViewerSession | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>('idle');
  const [state, setState] = useState<RemoteState | null>(null);
  const [activeControl, setActiveControl] = useState<null | 'focus' | 'iris' | 'wb' | 'iso'>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [immersiveFullscreen, setImmersiveFullscreen] = useState(false);
  const [fullscreenHintVisible, setFullscreenHintVisible] = useState(false);

  // Local optimistic values
  const [focus, setFocus] = useState(0.5);
  const [iris, setIris] = useState(0.5);
  const [wb, setWb] = useState(5600);
  const [iso, setIso] = useState(400);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    const s = startViewerSession({
      sessionId,
      onStream: (stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      },
      onState: (st) => {
        setState(st);
        setRecording(st.recording);
        setFocus(st.focus);
        setIris(st.iris);
        setWb(st.wb);
        setIso(st.iso);
      },
      onStatus: setStatus,
    });
    sessionRef.current = s;
    return () => s.close();
  }, [sessionId]);

  const isFullscreen = nativeFullscreen || immersiveFullscreen;

  useEffect(() => {
    const onFs = () => setNativeFullscreen(!!(document.fullscreenElement || (document as WebkitFullscreenDocument).webkitFullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('webkitfullscreenchange', onFs);
    return () => {
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('webkitfullscreenchange', onFs);
    };
  }, []);

  useEffect(() => {
    if (!immersiveFullscreen) return;
    const html = document.documentElement;
    const body = document.body;
    const previous = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyInset: body.style.inset,
      bodyWidth: body.style.width,
      bodyBackground: body.style.background,
    };
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.inset = '0';
    body.style.width = '100%';
    body.style.background = 'black';
    const nudge = () => window.scrollTo(0, 1);
    requestAnimationFrame(nudge);
    window.setTimeout(nudge, 120);
    return () => {
      html.style.overflow = previous.htmlOverflow;
      body.style.overflow = previous.bodyOverflow;
      body.style.position = previous.bodyPosition;
      body.style.inset = previous.bodyInset;
      body.style.width = previous.bodyWidth;
      body.style.background = previous.bodyBackground;
    };
  }, [immersiveFullscreen]);

  const send = sessionRef.current?.send ?? (() => {});

  const toggleFullscreen = async () => {
    try {
      const webkitDoc = document as WebkitFullscreenDocument;
      const standaloneNav = navigator as StandaloneNavigator;
      const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const standalone = window.matchMedia('(display-mode: standalone)').matches || standaloneNav.standalone === true;
      const isFs = !!(document.fullscreenElement || webkitDoc.webkitFullscreenElement) || immersiveFullscreen;
      if (!isFs) {
        const el = (containerRef.current || document.documentElement) as WebkitFullscreenElement;
        if (!isiOS && el.requestFullscreen) await el.requestFullscreen();
        else if (!isiOS && el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else {
          setImmersiveFullscreen(true);
          setControlsVisible(true);
          setFullscreenHintVisible(isiOS && !standalone);
          if (isiOS && !standalone) window.setTimeout(() => setFullscreenHintVisible(false), 6500);
        }
      } else {
        setImmersiveFullscreen(false);
        setFullscreenHintVisible(false);
        if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen();
        else if (webkitDoc.webkitExitFullscreen) webkitDoc.webkitExitFullscreen();
      }
    } catch (err) { console.warn('fullscreen toggle error', err); }
  };

  const overlayButton = (
    key: typeof activeControl,
    Icon: React.ComponentType<{ className?: string }>,
    label: string,
    value: string,
  ) => (
    <button
      type="button"
      onClick={() => setActiveControl((p) => (p === key ? null : key))}
      className={`flex flex-col items-center justify-center gap-1 px-2 py-1 min-w-[44px] text-white ${activeControl === key ? 'bg-white/20' : 'hover:bg-white/10'}`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="text-[9px] leading-none uppercase tracking-wide">{label}</span>
      <span className="text-[9px] leading-none opacity-80">{value}</span>
    </button>
  );

  const renderSliderPanel = () => {
    if (!activeControl) return null;
    if (activeControl === 'focus') {
      return (
        <div className="p-4 text-white">
          <div className="flex items-center justify-between text-xs mb-2">
            <span>Focus</span>
            <span className="opacity-70">{focus.toFixed(2)}</span>
          </div>
          <BlueSlider
            value={[focus]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(v) => { setFocus(v[0]); send({ type: 'focus', value: v[0] }); }}
          />
        </div>
      );
    }
    if (activeControl === 'iris') {
      return (
        <div className="p-4 text-white">
          <div className="flex items-center justify-between text-xs mb-2">
            <span>Iris</span>
            <span className="opacity-70">{iris.toFixed(2)}</span>
          </div>
          <BlueSlider
            value={[iris]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(v) => { setIris(v[0]); send({ type: 'iris', value: v[0] }); }}
          />
        </div>
      );
    }
    if (activeControl === 'wb') {
      const wbPresets: { label: string; value: number }[] = [
        { label: 'Κερί', value: 2500 },
        { label: 'Σπίτι', value: 3200 },
        { label: 'Φθόριο', value: 4000 },
        { label: 'Ημέρα', value: 5600 },
        { label: 'Flash', value: 6500 },
        { label: 'Συννεφιά', value: 7500 },
        { label: 'Σκιά', value: 9000 },
      ];
      return (
        <div className="p-4 text-white bg-black/70 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs mb-2">
            <span>White Balance</span>
            <span className="opacity-70">{wb}K</span>
          </div>
          <BlueSlider
            value={[wb]}
            min={2500}
            max={10000}
            step={50}
            onValueChange={(v) => { const k = Math.round(v[0]); setWb(k); send({ type: 'wb', value: k }); }}
          />
          <div className="flex flex-wrap gap-1 mt-3">
            {wbPresets.map((p) => (
              <Button
                key={p.value}
                size="sm"
                variant="outline"
                className={`rounded-none text-xs h-7 px-2 bg-transparent text-white border-white/20 hover:bg-white/10 ${wb === p.value ? 'bg-white/20 border-white' : ''}`}
                onClick={() => { setWb(p.value); send({ type: 'wb', value: p.value }); }}
              >
                {p.label} {p.value}K
              </Button>
            ))}
          </div>
        </div>
      );
    }
    if (activeControl === 'iso') {
      const steps = [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600];
      const idx = Math.max(0, steps.indexOf(iso));
      return (
        <div className="p-4 text-white bg-black/70 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs mb-2">
            <span>ISO</span>
            <span className="opacity-70">{iso}</span>
          </div>
          <BlueSlider
            value={[idx >= 0 ? idx : 2]}
            min={0}
            max={steps.length - 1}
            step={1}
            onValueChange={(v) => { const val = steps[v[0]]; setIso(val); send({ type: 'iso', value: val }); }}
          />
          <div className="flex flex-wrap gap-1 mt-3">
            {steps.map((val) => (
              <Button
                key={val}
                size="sm"
                variant="outline"
                className={`rounded-none text-xs h-7 px-2 bg-transparent text-white border-white/20 hover:bg-white/10 ${iso === val ? 'bg-white/20 border-white' : ''}`}
                onClick={() => { setIso(val); send({ type: 'iso', value: val }); }}
              >
                {val}
              </Button>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const connected = status === 'connected';

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden"
      style={{ height: '100dvh', width: '100vw', touchAction: 'manipulation', WebkitUserSelect: 'none' } as React.CSSProperties}
    >
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        disablePictureInPicture
        controls={false}
        controlsList="nodownload nofullscreen noremoteplayback"
        className="absolute inset-0 w-full h-full object-contain"
      />

      {!connected && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center text-white bg-black/80">
          {status === 'connecting' || status === 'idle' ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin mb-3" />
              <p>Σύνδεση με τον υπολογιστή...</p>
              <p className="text-xs opacity-60 mt-1">Session: {sessionId}</p>
              <p className="text-xs opacity-60 mt-3 max-w-xs text-center">
                Βεβαιώσου ότι η σελίδα Blackmagic View είναι ανοιχτή και το share session ενεργό.
              </p>
            </>
          ) : (
            <>
              <WifiOff className="h-10 w-10 mb-3" />
              <p>Η σύνδεση χάθηκε</p>
              <Button
                className="mt-4 rounded-none"
                onClick={() => window.location.reload()}
              >
                Επανασύνδεση
              </Button>
            </>
          )}
        </div>
      )}

      {/* Click-catcher */}
      <div
        className="absolute inset-0 z-10"
        onClick={() => { setControlsVisible((v) => !v); setActiveControl(null); }}
      />

      {/* Top controls */}
      <div
        className={`absolute top-1 left-2 right-2 z-40 flex items-start justify-end gap-2 pointer-events-none transition-opacity ${controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="flex items-center gap-1 pointer-events-auto" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
          {overlayButton('focus', Focus, 'Focus', focus.toFixed(2))}
          {overlayButton('iris', Aperture, 'Iris', iris.toFixed(2))}
          {overlayButton('wb', Thermometer, 'WB', `${wb}K`)}
          {overlayButton('iso', Gauge, 'ISO', `${iso}`)}
          <Button
            size="sm"
            variant="outline"
            className="rounded-none bg-transparent text-white hover:bg-white/10 border-1 border-white/10"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {activeControl && controlsVisible && (
        <div className="absolute left-1/2 -translate-x-1/2 top-14 z-40 w-[92%] max-w-xl pointer-events-auto touch-none" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
          {renderSliderPanel()}
        </div>
      )}

      {fullscreenHintVisible && controlsVisible && (
        <div className="absolute left-3 right-3 bottom-20 z-30 bg-black/80 border border-white/20 p-3 text-center text-xs text-white pointer-events-none">
          Για πραγματικό fullscreen στο iPhone: Share → Add to Home Screen και άνοιγμα από το εικονίδιο.
        </div>
      )}

      {/* REC */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => { const next = !recording; setRecording(next); send({ type: 'record', value: next }); }}
          disabled={!connected}
          aria-label={recording ? 'Stop recording' : 'Start recording'}
          className="flex items-center justify-center w-14 h-14 hover:bg-white/10 disabled:opacity-40"
        >
          {recording ? (
            <span className="block w-5 h-5 bg-red-600" />
          ) : (
            <span className="block w-8 h-8 rounded-full bg-red-600" />
          )}
        </button>
      </div>
    </div>
  );
};

export default RemoteCameraView;
