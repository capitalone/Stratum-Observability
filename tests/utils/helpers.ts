import { DEBUG_KEY, STORED_SESSION_ID_KEY, StratumService, GLOBAL_LISTENER_KEY } from '../../src';
import { webcrypto } from 'node:crypto';
import { globalWindow, SESSION_ID } from './constants';

export function getPublishers(service: StratumService) {
  return Object.values(service['publishers']);
}

export function enableDebugMode(value: boolean) {
  sessionStorage.setItem(DEBUG_KEY, '' + value);
}

export function isUuid(uuid: string) {
  const regExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regExp.test(uuid);
}

export function mockNewRelic() {
  globalWindow.newrelic = {
    end: () => globalWindow.newrelic,
    interaction: () => globalWindow.newrelic,
    save: () => globalWindow.newrelic,
    setAttribute: () => globalWindow.newrelic,
    setName: () => globalWindow.newrelic
  };
}

export function mockCrypto() {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true
  });
}

export function restoreStratumMocks() {
  Object.keys(globalWindow).forEach((k) => {
    if (k.startsWith('stratum')) {
      delete globalWindow[k];
    }
  });
  delete globalWindow[GLOBAL_LISTENER_KEY];
  delete globalWindow.newRelic;
  localStorage.clear();
  sessionStorage.clear();

  /* eslint-disable @typescript-eslint/no-explicit-any */
  delete (globalThis as any).crypto;
}

export function removeAllPublishers(stratum: StratumService) {
  while (stratum.publishers.length > 0) {
    stratum.publishers.pop();
  }
}

export function mockSessionId(id?: string) {
  sessionStorage.setItem(STORED_SESSION_ID_KEY, id ? id : SESSION_ID);
}
