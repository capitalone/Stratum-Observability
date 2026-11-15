import { afterEach, vi } from 'vitest';
import { restoreStratumMocks } from './utils';

// Because window is not available in tests, alias it for any app code still referencing it directly
Object.defineProperty(globalThis, 'window', {
  value: globalThis,
  configurable: true,
  writable: true
});

// Simple localStorage mock since localStorage is not present in Node by default
const store = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear()
  }
});

afterEach(() => {
  restoreStratumMocks();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
