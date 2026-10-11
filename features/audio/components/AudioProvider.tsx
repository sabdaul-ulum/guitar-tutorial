'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { AudioFrame, StrumEvent, Microphone } from '../lib/microphone.ts';
import { microphoneError } from '../lib/audio-levels.ts';
type AudioState = AudioFrame & { status: 'off' | 'connecting' | 'suspended' | 'calibrating' | 'ready' };
type AudioListener = { onFrame?: (frame: AudioFrame) => void; onStrum?: (event: StrumEvent) => void };
type AudioContextValue = { audio: AudioState; devices: MediaDeviceInfo[]; deviceId: string; autoGainControl: boolean; error: string; connect: () => Promise<void>; disconnect: () => void; refreshDevices: () => Promise<void>; subscribe: (listener: AudioListener) => () => void; selectDevice: (id: string) => void; selectGain: (enabled: boolean) => void };
const AudioContext = createContext<AudioContextValue | null>(null);
const EMPTY: AudioState = {
  status: 'off',
  rms: 0,
  frequency: 0,
  clarity: 0
};
export function AudioProvider({
  children
}: { children: React.ReactNode }) {
  const [audio, setAudio] = useState(EMPTY);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState('');
  const [autoGainControl, setAutoGainControl] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<Microphone | null>(null);
  const generation = useRef(0);
  const listeners = useRef(new Set<AudioListener>());
  const lastRender = useRef(0);
  const mounted = useRef(false);
  const refreshDevices = useCallback(async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      if (mounted.current) {
        setDevices(list.filter(device => device.kind === 'audioinput'));
      }
    } catch {
      if (mounted.current) {
        setError('Daftar input tidak tersedia. Izinkan mikrofon dan gunakan localhost/HTTPS.');
      }
    }
  }, []);
  function disconnect() {
    generation.current++;
    input.current?.stop();
    input.current = null;
    setAudio(EMPTY);
  }
  async function connect() {
    disconnect();
    const token = generation.current;
    setError('');
    setAudio({
      ...EMPTY,
      status: 'connecting'
    });
    try {
      const {
        Microphone
      } = await import('../lib/microphone.ts');
      if (token !== generation.current) {
        return;
      }
      const microphone = new Microphone(frame => {
        if (token !== generation.current) {
          return;
        }
        for (const listener of listeners.current) listener.onFrame?.(frame);
        if (frame.contextState !== 'running' || performance.now() - lastRender.current >= 100) {
          lastRender.current = performance.now();
          setAudio({
            ...frame,
            status: frame.contextState !== 'running' ? 'suspended' : frame.calibrating ? 'calibrating' : 'ready'
          });
        }
      }, event => {
        if (token === generation.current) {
          for (const listener of listeners.current) listener.onStrum?.(event);
        }
      }, () => {
        if (token !== generation.current) {
          return;
        }
        disconnect();
        setError('Perangkat terputus. Hubungkan kembali mikrofon.');
      });
      input.current = microphone;
      await microphone.start({
        deviceId,
        autoGainControl
      });
      if (token === generation.current) {
        await refreshDevices();
      }
    } catch (cause) {
      if (token === generation.current) {
        disconnect();
        setError(microphoneError(cause));
      }
    }
  }
  useEffect(() => {
    mounted.current = true;
    void refreshDevices();
    const media = navigator.mediaDevices;
    media?.addEventListener('devicechange', refreshDevices);
    return () => {
      mounted.current = false;
      generation.current++;
      input.current?.stop();
      input.current = null;
      media?.removeEventListener('devicechange', refreshDevices);
    };
  }, [refreshDevices]);
  const subscribe = useCallback((listener: AudioListener) => {
    listeners.current.add(listener);
    return () => { listeners.current.delete(listener); };
  }, []);
  return <AudioContext.Provider value={{
    audio,
    devices,
    deviceId,
    autoGainControl,
    error,
    connect,
    disconnect,
    refreshDevices,
    subscribe,
    selectDevice: id => {
      if (typeof id !== 'string' || id && !devices.some(device => device.deviceId === id)) {
        return;
      }
      disconnect();
      setDeviceId(id);
    },
    selectGain: enabled => {
      if (typeof enabled !== 'boolean') {
        return;
      }
      disconnect();
      setAutoGainControl(enabled);
    }
  }}>{children}</AudioContext.Provider>;
}
export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider.');
  }
  return context;
}
