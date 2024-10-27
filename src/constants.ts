/**
 * Sessions storage key used to store the default session id across
 * a user session.
 */
export const STORED_SESSION_ID_KEY = 'stm_internal_id';

/**
 * Session storage key that controls whether debug mode is enabled.
 */
export const DEBUG_KEY = 'stratumdb';

/**
 * Key on the globalThis object that stratum will check for when
 * looking for event listener callbacks.
 *
 * Callback functions registered under
 * `globalThis[GLOBAL_LISTENER_KEY].listeners` will be
 * executed by any StratumService instance regardless of productName.
 */
export const GLOBAL_LISTENER_KEY = 'stratum_global';
