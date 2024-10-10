import { AUTO_LOGGING_KEY, DEBUG_KEY, GLOBAL_LISTENER_KEY, STORED_SESSION_ID_KEY } from '../constants';
import type { StratumEventListenerFn } from '../types';
import { isDefined } from './types';

/**
 * Helper function to append a given listener callback function to the
 * globalThis (or given parent) object.
 * Expected keys:
 *  - `stratum_config_${STRATUM_ID}` - if listener should be scoped to a given application
 *  - `stratum_global` - if listener should be called on any stratum instance available
 *
 * @return {boolean} Returns whether the attempt to set the provided function was successful
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
function _instantiateStratumEventListener(key: string, fn: StratumEventListenerFn, host?: any): boolean {
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
 * Function to add a Stratum event listener callback
 * function to the global parent, if available.
 *
 * The provided function will be executed each time your
 * product's Stratum service publishes a tag (based on
 * matching product names).
 *
 * You can also choose to set up the event listener directly
 * on the global parent object. However, using this function is safer
 * since it ensures that other event listeners set up on
 * the service in parallel will not be accidentally overwritten.
 *
 * @return {boolean} Returns whether the attempt to set the provided function was successful
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function addStratumEventListener(id: string, fn: StratumEventListenerFn, host?: any): boolean {
  return _instantiateStratumEventListener(`stratum_config_${id}`, fn, host);
}

/**
 * Global function to add a Stratum event listener callback
 * function to the global parent object, if available.
 *
 * The provided function will be executed any time any Stratum
 * instance within the given host publishes.
 *
 * You can also choose to set up the event listener directly
 * on the global parent object. However, using this function is safer
 * since it ensures that other event listeners set up on
 * the service in parallel will not be accidentally overwritten.
 *
 * @return {boolean} Returns whether the attempt to set the provided function was successful
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function addGlobalStratumEventListener(fn: StratumEventListenerFn, host?: any): boolean {
  return _instantiateStratumEventListener(GLOBAL_LISTENER_KEY, fn, host);
}

/**
 * Function to generate a new span id using Stratum's default
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
 * Utility class to write to the console. This class should be used to
 * emit any logs instead of relying on the actual console object.
 *
 * This class serves as a layer so that logs emitted throughout
 * the package are subject to debug mode checks.
 */
export class Logger {
  /**
   * Write logs to the console only if auto-logging is
   * turned on
   */
  autoLog(...args: unknown[]) {
    if (autoLoggingEnabled()) {
      console.log('[Stratum]', ...args);
    }
  }

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
 * set in local storage.
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
 * Utility function to check if Stratum's auto logging key
 * is set in local storage.
 *
 * If auto logging is enabled, stratum events will be logged
 * to the console on publish
 *
 * @return {boolean} Flag indicating if auto logging is enabled.
 */
export function autoLoggingEnabled(): boolean {
  try {
    return sessionStorage.getItem(AUTO_LOGGING_KEY)?.toLowerCase() === 'true';
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
