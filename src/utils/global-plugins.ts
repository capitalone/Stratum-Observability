import { GenericPlugin } from '../types';

/**
 * Utility class that provides helpers to manage Stratum global plugins which are stored at the global level in window.stratum namespace.
 */
export class GlobalPlugins {
  /**
   * Retrieve the list of plugins from the global namespace
   */
  static get plugins() {
    return window?.stratum?.globalPlugins;
  }

  /**
   * Adds a plugin to the global namespace
   * @param plugin - GenericPlugin - Plugin to add
   * @returns - GenericPlugin[] - Returns the full list of global plugins after adding.
   */
  static addPlugin(plugin: GenericPlugin): GenericPlugin[] {
    // initialize stratum namespace if not exist
    if (!window.stratum) {
      window.stratum = {};
    } // if

    // initialize stratum globalPlugins if not exists
    if (!window.stratum.globalPlugins) {
      window.stratum.globalPlugins = [];
    } // if

    window.stratum.globalPlugins.push(plugin);

    return GlobalPlugins.plugins;
  }

  /**
   * Removes a Stratum pluging from the global namespace. If there are duplicate plugin names, it will only remove the first one that was added.
   * @param pluginName - string - Name of plugin to remove from global plugins list.
   * @returns - GenericPlugin[] - Returns the full list of global plutins after removal.
   */
  static removePlugin(pluginName: string) {
    if (pluginName && window.stratum?.globalPlugins?.length > 0) {
      const idx = window.stratum.globalPlugins.findIndex((plugin: GenericPlugin) => plugin.name === pluginName);

      if (idx > -1) {
        window.stratum.globalPlugins.splice(idx, 1);
      } // if
    } // if

    return GlobalPlugins.plugins;
  }
}
