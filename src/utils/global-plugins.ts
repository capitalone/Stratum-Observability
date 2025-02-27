import { GLOBAL_LISTENER_KEY } from '../constants';
import { GenericPlugin } from '../types';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const g = globalThis as any;

/**
 * Retrieve the list of plugins from the global namespace
 */
export function getGlobalPlugins(): GenericPlugin[] {
  return g?.[GLOBAL_LISTENER_KEY]?.globalPlugins || [];
}

/**
 * Adds a plugin to the global namespace
 * @param plugin - GenericPlugin - Plugin to add
 * @returns - GenericPlugin[] - Returns the full list of global plugins after adding.
 */
export function addGlobalPlugin(plugin: GenericPlugin): GenericPlugin[] {
  // initialize stratum namespace if not exist
  if (!g[GLOBAL_LISTENER_KEY]) {
    g[GLOBAL_LISTENER_KEY] = {};
  } // if

  // initialize stratum globalPlugins if not exists
  if (!g[GLOBAL_LISTENER_KEY].globalPlugins) {
    g[GLOBAL_LISTENER_KEY].globalPlugins = [];
  } // if

  g[GLOBAL_LISTENER_KEY].globalPlugins.push(plugin);

  return getGlobalPlugins();
}

/**
 * Removes a Stratum pluging from the global namespace. If there are duplicate plugin names, it will only remove the first one that was added.
 * @param pluginName - string - Name of plugin to remove from global plugins list.
 * @returns - GenericPlugin[] - Returns the full list of global plutins after removal.
 */
export function removeGlobalPlugin(pluginName: string) {
  if (pluginName && g[GLOBAL_LISTENER_KEY]?.globalPlugins?.length > 0) {
    const idx = g[GLOBAL_LISTENER_KEY].globalPlugins.findIndex((plugin: GenericPlugin) => plugin.name === pluginName);

    if (idx > -1) {
      g[GLOBAL_LISTENER_KEY].globalPlugins.splice(idx, 1);
    } // if
  } // if

  return getGlobalPlugins();
}
