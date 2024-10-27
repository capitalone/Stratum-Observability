import { DEBUG_KEY, GLOBAL_LISTENER_KEY, STORED_SESSION_ID_KEY } from '../constants';
import type { StratumSnapshotListenerFn } from '../types';
import { isDefined } from './general';

/**
 * Helper function to append a given listener callback function to globalThis (or provided).
 * Expected keys:
 *  - `stratum_config_${STRATUM_ID}` - if listener should be scoped to a given application
 *  - `stratum_global` - if listener should be called on any stratum instance available
 *
 * @return {boolean} Returns whether the attempt to set the provided function was successful
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
function _instantiateStratumSnapshotListener(key: string, fn: StratumSnapshotListenerFn, host?: any): boolean {
  try {
    if (!isDefined(host)) {
      host = globalThis;
    }
    if (!isDefined(host[key])) {
      host[key] = {};
    }
    if (!Array.isArray(host[key].listeners)) {
      host[key].listeners = [];
    }
    host[key].listeners.push(fn);
    return true;
  } catch {
    return false;
  }
}

/**
 * Function to add a Stratum snapshot listener callback
 * function to a parent.
 *
 * The provided function will be executed each time a 
 * StratumService with a matching id publishes an event.
 *
 * Using this function ensures that any other listeners added in
 * parallel will not be accidentally overwritten.
 *
 * @return {boolean} Returns whether the attempt to set the provided function was successful
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function addStratumSnapshotListener(id: string, fn: StratumSnapshotListenerFn, host?: any): boolean {
  return _instantiateStratumSnapshotListener(`stratum_config_${id}`, fn, host);
}

/**
 * Global function to add a Stratum snapshot listener callback
 * function to the global parent, if available.
 *
 * The provided function will be executed any time any event is
 * published within the specified parent (or globalThis, if unspecified)
 *
 * Using this function ensures that any other listeners added in
 * parallel will not be accidentally overwritten.
 *
 * @return {boolean} Returns whether the attempt to set the provided function was successful
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function addGlobalStratumSnapshotListener(fn: StratumSnapshotListenerFn, host?: any): boolean {
  return _instantiateStratumSnapshotListener(GLOBAL_LISTENER_KEY, fn, host);
}

/**
 * Function to generate a new id using Stratum's default
 * session id logic.
 *
 * Returns a UUID, preferring a session storage value if present.
 * Otherwise a random uuid is generated and added to session storage
 * for future retrievals.
 */
export function generateDefaultSessionId(): string {
  let id = '';
  try {
    const storedId = sessionStorage.getItem(STORED_SESSION_ID_KEY);
    if (isDefined(storedId)) {
      id = storedId;
    } else {
      id = uuid();
      sessionStorage.setItem(STORED_SESSION_ID_KEY, id);
    }
  } catch {
    id = uuid();
  }
  return id;
}

/**
 * Utility class to write to the console.
 *
 * This class serves as a layer so that logs emitted throughout
 * the package are subject to debug mode checks.
 */
export class Logger {
  /**
   * Write warnings to the console only if debug mode is enabled
   */
  debug(...args: unknown[]) {
    if (debugModeEnabled()) {
      console.debug('[Stratum]', ...args);
    }
  }
}

/**
 * Utility function to check if the Stratum debug key is
 * set in session storage.
 *
 * If debug mode is enabled, logging output will be sent to the
 * console and custom event listeners will be enabled.
 *
 * @return {boolean} Flag indicating if debug mode is enabled.
 */
export function debugModeEnabled(): boolean {
  try {
    return sessionStorage.getItem(DEBUG_KEY)?.toLowerCase() === 'true';
  } catch {
    return false;
  }
}

/**
 * Utility function to return a random uuid. Returns a
 * nil uuid if generation fails
 *
 * @return {string} Random or nil uuid string
 */
export function uuid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return '00000000-0000-0000-0000-000000000000';
  }
}
