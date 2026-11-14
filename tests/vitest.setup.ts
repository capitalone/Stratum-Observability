import { afterEach, vi } from 'vitest';
import { restoreStratumMocks } from './utils';

afterEach(() => {
  restoreStratumMocks();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
