import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BlueSlider } from '@/components/ui/blue-slider';
import {
  Focus, Aperture, Thermometer, Gauge, Maximize2, Minimize2, Loader2, WifiOff,
} from 'lucide-react';
import {
  startViewerSession,
  type ViewerSession,
  type RemoteState,
} from '@/lib/blackmagicRemoteSession';

const RemoteCameraView: React.FC = () => {
  const { sessionId = '' } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionRef = useRef<ViewerSession | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>('idle');
  const [state, setState] = useState<RemoteState | null>(null);
  const [activeControl, setActiveControl] = useState<null | 'focus' | 'iris' | 'wb' | 'iso'>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const send = sessionRef.current?.send ?? (() => {});

  const toggleFullscreen = async () => {
    try {
      const anyDoc = document as any;
      const isFs = !!(document.fullscreenElement || anyDoc.webkitFullscreenElement);
      if (!isFs) {
        const el: any = containerRef.current || document.documentElement;
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else if ((videoRef.current as any)?.webkitEnterFullscreen) {
          (videoRef.current as any).webkitEnterFullscreen();
        }
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (anyDoc.webkitExitFullscreen) anyDoc.webkitExitFullscreen();
      }
    } catch {}
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
      return (
        <div className="p-4 text-white">
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
          <Button
            variant="outline"
            className="w-full rounded-none mt-3 bg-white/10 border-white/30 text-white hover:bg-white/20"
            onClick={() => send({ type: 'autowb' })}
          >
            Auto WB
          </Button>
        </div>
      );
    }
    if (activeControl === 'iso') {
      const steps = [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600];
      const idx = Math.max(0, steps.indexOf(iso));
      return (
        <div className="p-4 text-white">
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
        </div>
      );
    }
    return null;
  };

  const connected = status === 'connected';

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black overflow-hidden">
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
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
        className={`absolute top-1 left-2 right-2 z-20 flex items-start justify-end gap-2 pointer-events-none transition-opacity ${controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="flex items-center gap-1 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
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
        <div className="absolute left-1/2 -translate-x-1/2 top-14 z-20 w-[92%] max-w-xl pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          {renderSliderPanel()}
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
