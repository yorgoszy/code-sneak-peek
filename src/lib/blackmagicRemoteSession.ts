// WebRTC + Supabase Realtime signaling for remote Blackmagic camera viewing.
// Host streams its local cameraStream to remote viewer; viewer sends control
// commands back via a reliable data channel.

import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export type RemoteCommand =
  | { type: 'record'; value: boolean }
  | { type: 'autofocus' }
  | { type: 'autowb' }
  | { type: 'focus'; value: number }
  | { type: 'iris'; value: number }
  | { type: 'wb'; value: number }
  | { type: 'iso'; value: number };

export type RemoteState = {
  connected: boolean;
  recording: boolean;
  focus: number;
  iris: number;
  wb: number;
  iso: number;
};

const channelName = (sessionId: string) => `bmd-remote-${sessionId}`;

// ─────────────────────────── HOST ───────────────────────────
export interface HostSessionOptions {
  sessionId: string;
  getStream: () => MediaStream | null;
  onCommand: (cmd: RemoteCommand) => void;
  getState: () => RemoteState;
  onViewerChange?: (count: number) => void;
}

export interface HostSession {
  close: () => void;
}

export function startHostSession(opts: HostSessionOptions): HostSession {
  const { sessionId, getStream, onCommand, getState, onViewerChange } = opts;
  let pc: RTCPeerConnection | null = null;
  let dc: RTCDataChannel | null = null;
  let viewerCount = 0;

  const channel: RealtimeChannel = supabase.channel(channelName(sessionId), {
    config: { broadcast: { self: false, ack: false } },
  });

  const send = (payload: unknown) =>
    channel.send({ type: 'broadcast', event: 'signal', payload });

  const sendState = () => {
    if (dc && dc.readyState === 'open') {
      try { dc.send(JSON.stringify({ type: 'state', state: getState() })); } catch {}
    }
  };

  const setupPeer = async () => {
    if (pc) try { pc.close(); } catch {}
    pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const stream = getStream();
    if (stream) stream.getTracks().forEach((t) => pc!.addTrack(t, stream));
    dc = pc.createDataChannel('cmd', { ordered: true });
    dc.onopen = () => {
      viewerCount = 1;
      onViewerChange?.(viewerCount);
      sendState();
    };
    dc.onclose = () => {
      viewerCount = 0;
      onViewerChange?.(viewerCount);
    };
    dc.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg?.type === 'cmd') onCommand(msg.cmd as RemoteCommand);
        if (msg?.type === 'ping') sendState();
      } catch {}
    };
    pc.onicecandidate = (e) => {
      if (e.candidate) send({ kind: 'ice-host', candidate: e.candidate.toJSON() });
    };
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    send({ kind: 'offer', sdp: pc.localDescription });
  };

  channel
    .on('broadcast', { event: 'signal' }, async ({ payload }) => {
      const p: any = payload;
      if (!p) return;
      if (p.kind === 'join') {
        await setupPeer();
      } else if (p.kind === 'answer' && pc) {
        try { await pc.setRemoteDescription(p.sdp); } catch (e) { console.warn(e); }
      } else if (p.kind === 'ice-viewer' && pc && p.candidate) {
        try { await pc.addIceCandidate(p.candidate); } catch (e) { console.warn(e); }
      }
    })
    .subscribe();

  // Push state on every change (poll lightly)
  const stateTimer = setInterval(sendState, 1000);

  return {
    close: () => {
      clearInterval(stateTimer);
      try { dc?.close(); } catch {}
      try { pc?.close(); } catch {}
      try { supabase.removeChannel(channel); } catch {}
    },
  };
}

// ─────────────────────────── VIEWER ───────────────────────────
export interface ViewerSessionOptions {
  sessionId: string;
  onStream: (stream: MediaStream) => void;
  onState: (state: RemoteState) => void;
  onStatus: (status: 'idle' | 'connecting' | 'connected' | 'disconnected') => void;
}

export interface ViewerSession {
  send: (cmd: RemoteCommand) => void;
  close: () => void;
}

export function startViewerSession(opts: ViewerSessionOptions): ViewerSession {
  const { sessionId, onStream, onState, onStatus } = opts;
  let pc: RTCPeerConnection | null = null;
  let dc: RTCDataChannel | null = null;
  let pendingIce: RTCIceCandidateInit[] = [];
  let remoteSet = false;

  onStatus('connecting');

  const channel: RealtimeChannel = supabase.channel(channelName(sessionId), {
    config: { broadcast: { self: false, ack: false } },
  });

  const send = (payload: unknown) =>
    channel.send({ type: 'broadcast', event: 'signal', payload });

  const ensurePeer = () => {
    if (pc) return pc;
    pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.ontrack = (e) => {
      if (e.streams[0]) onStream(e.streams[0]);
    };
    pc.onicecandidate = (e) => {
      if (e.candidate) send({ kind: 'ice-viewer', candidate: e.candidate.toJSON() });
    };
    pc.ondatachannel = (e) => {
      dc = e.channel;
      dc.onopen = () => {
        onStatus('connected');
        try { dc!.send(JSON.stringify({ type: 'ping' })); } catch {}
      };
      dc.onclose = () => onStatus('disconnected');
      dc.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg?.type === 'state') onState(msg.state as RemoteState);
        } catch {}
      };
    };
    pc.onconnectionstatechange = () => {
      if (!pc) return;
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        onStatus('disconnected');
      }
    };
    return pc;
  };

  channel
    .on('broadcast', { event: 'signal' }, async ({ payload }) => {
      const p: any = payload;
      if (!p) return;
      if (p.kind === 'offer') {
        const peer = ensurePeer();
        try {
          await peer.setRemoteDescription(p.sdp);
          remoteSet = true;
          for (const c of pendingIce) {
            try { await peer.addIceCandidate(c); } catch {}
          }
          pendingIce = [];
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          send({ kind: 'answer', sdp: peer.localDescription });
        } catch (e) {
          console.warn('viewer offer error', e);
        }
      } else if (p.kind === 'ice-host' && p.candidate) {
        const peer = ensurePeer();
        if (remoteSet) {
          try { await peer.addIceCandidate(p.candidate); } catch {}
        } else {
          pendingIce.push(p.candidate);
        }
      }
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        send({ kind: 'join' });
      }
    });

  return {
    send: (cmd) => {
      if (dc && dc.readyState === 'open') {
        try { dc.send(JSON.stringify({ type: 'cmd', cmd })); } catch {}
      }
    },
    close: () => {
      try { dc?.close(); } catch {}
      try { pc?.close(); } catch {}
      try { supabase.removeChannel(channel); } catch {}
    },
  };
}

export function generateSessionId() {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}
