import { LESSONS } from '../../learning/domain/curriculum.ts';
export const PROGRESS_VERSION = 2;
export const PROGRESS_STORAGE_KEY = 'petik-curriculum-v2';
export function readProgress(value: unknown): string[] {
  if (!value || typeof value !== 'object' || !('version' in value) || value.version !== PROGRESS_VERSION || !('completed' in value) || !Array.isArray(value.completed)) {
    return [];
  }
  const completed = value.completed;
  return LESSONS.filter(lesson => completed.includes(lesson.id)).map(lesson => lesson.id);
}
export function mergeProgress(current: readonly string[], incoming: readonly string[]) {
  const completed = new Set([...current, ...incoming]);
  return LESSONS.filter(lesson => completed.has(lesson.id)).map(lesson => lesson.id);
}

export function syncProgress(current: readonly string[], stored: string | null, reset = false) {
  if (reset) {
    return [];
  }
  let value: unknown;
  try {
    value = JSON.parse(stored ?? 'null');
  } catch (error) {
    if (!(error instanceof SyntaxError)) {
      throw error;
    }
    // Malformed JSON has no recoverable progress; keep the session for the next write.
    value = null;
  }
  return mergeProgress(current, readProgress(value));
}

export function syncStorageProgress(current: readonly string[], stored: string | null, incoming: string | null) {
  // ponytail: removal wins while storage is absent; atomic reset/write ordering needs a versioned reset protocol.
  if (stored === null) {
    return [];
  }
  return syncProgress(syncProgress(current, incoming), stored);
}

export function serializeProgress(completed: readonly string[]) {
  return JSON.stringify({
    version: PROGRESS_VERSION,
    completed
  });
}
