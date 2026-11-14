import { type Mock, vi } from 'vitest';
import { DEBUG_KEY, STORED_SESSION_ID_KEY, type StratumService } from '@';
import { SESSION_ID } from './constants';

export function getPublishers(service: StratumService) {
  return Object.values(service.publishers);
}

export function enableDebugMode(value: boolean) {
  sessionStorage.setItem(DEBUG_KEY, `${value}`);
}

export function isUuid(uuid: string) {
  const regExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regExp.test(uuid);
}

export function getStratumGlobalConfig(key: string) {
  const globals = globalThis as unknown as Record<string, { listeners: unknown[]; globalPlugins: unknown[] }>;
  return globals[key];
}

export function mockNewRelic() {
  const METHODS = ['end', 'interaction', 'save', 'setAttribute', 'setName'] as const;
  type NewRelicMock = Record<(typeof METHODS)[number], Mock>;
  const nr = {} as NewRelicMock;
  for (const m of METHODS) {
    nr[m] = vi.fn(() => nr);
  }
  vi.stubGlobal('newrelic', nr);
  return nr;
}

export function restoreStratumMocks() {
  for (const key of Reflect.ownKeys(globalThis)) {
    if (typeof key === 'string' && key.startsWith('stratum')) {
      Reflect.deleteProperty(globalThis, key);
    }
  }
  localStorage.clear();
  sessionStorage.clear();
}

export function removeAllPublishers(stratum: StratumService) {
  while (stratum.publishers.length > 0) {
    stratum.publishers.pop();
  }
}

export function mockSessionId(id?: string) {
  sessionStorage.setItem(STORED_SESSION_ID_KEY, id ? id : SESSION_ID);
}
