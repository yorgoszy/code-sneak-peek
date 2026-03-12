import React, { useEffect, useRef, useState } from 'react';
import { Video } from 'lucide-react';

interface CameraFeedProps {
  deviceId?: string | null;
  className?: string;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({ deviceId, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let active = true;

    const startCamera = async () => {
      try {
        // Stop previous stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }

        const constraints: MediaStreamConstraints = {
          video: deviceId ? { deviceId: { exact: deviceId } } : true,
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setError(null);
      } catch (err) {
        console.error('Camera error:', err);
        setError('Camera not available');
      }
    };

    startCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [deviceId]);

  if (error) {
    return (
      <div className={`bg-black flex items-center justify-center ${className || ''}`}>
        <div className="text-center text-white/60">
          <Video className="h-6 w-6 mx-auto mb-1" />
          <p className="text-xs">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={`w-full h-full object-cover ${className || ''}`}
    />
  );
};
