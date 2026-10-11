'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { isKnownLesson } from '../../learning/domain/curriculum.ts';
import { syncProgress, syncStorageProgress, serializeProgress, PROGRESS_STORAGE_KEY } from '../domain/progress.ts';
type ProgressContextValue = {
  completed: string[];
  ready: boolean;
  warning: string;
  complete: (id: string) => void;
};
const ProgressContext = createContext<ProgressContextValue | null>(null);
export function ProgressProvider({
  children
}: { children: React.ReactNode }) {
  const [completed, setCompleted] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [warning, setWarning] = useState('');
  const current = useRef<string[]>([]);
  useEffect(() => {
    function load() {
      try {
        current.current = syncProgress(current.current, localStorage.getItem(PROGRESS_STORAGE_KEY));
        setCompleted(current.current);
      } catch {
        setWarning('Progres tidak dapat dibaca. Progres sesi tetap tersedia.');
      }
      setReady(true);
    }
    load();
    function sync(event: StorageEvent) {
      if (event.key !== PROGRESS_STORAGE_KEY && event.key !== null) {
        return;
      }
      try {
        if (event.storageArea !== localStorage) {
          return;
        }
        const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
        current.current = syncStorageProgress(current.current, stored, event.newValue);
        setCompleted(current.current);
        const encoded = serializeProgress(current.current);
        if (stored !== null && stored !== encoded) {
          // Repair concurrent writes without ping-pong between tabs.
          localStorage.setItem(PROGRESS_STORAGE_KEY, encoded);
        }
        setWarning('');
      } catch {
        setWarning('Progres sesi tersedia, tetapi sinkronisasi perangkat bermasalah.');
      }
    }
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  function complete(id: string) {
    if (!ready || !isKnownLesson(id)) {
      return;
    }
    if (!current.current.includes(id)) {
      current.current = [...current.current, id];
    }
    setCompleted(current.current);
    try {
      current.current = syncProgress(current.current, localStorage.getItem(PROGRESS_STORAGE_KEY));
      setCompleted(current.current);
      localStorage.setItem(PROGRESS_STORAGE_KEY, serializeProgress(current.current));
      setWarning('');
    } catch {
      setWarning('Progres sesi berhasil, tetapi penyimpanan perangkat tidak tersedia.');
    }
  }
  return <ProgressContext.Provider value={{
    completed,
    ready,
    warning,
    complete
  }}>{children}</ProgressContext.Provider>;
}
export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within ProgressProvider.');
  }
  return context;
}
