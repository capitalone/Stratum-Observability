import { afterEach, vi } from 'vitest';
import { restoreStratumMocks } from './utils';

/**
 * Alias window to globalThis during test runs where window is not available.
 * Window is still referenced directly in NR plugins.
 */
Object.defineProperty(globalThis, 'window', {
  value: globalThis,
  configurable: true,
  writable: true
});

afterEach(() => {
  restoreStratumMocks();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
