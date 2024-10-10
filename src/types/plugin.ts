import type { BasePlugin } from '../base';

/**
 * Helper type to specify a base plugin of any type
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type GenericPlugin = BasePlugin<any, any>;

/**
 * Format of general options object. Individual plugins
 * can provide child definitions of this type to
 * define specific option keys.
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type PluginOptions = Record<string, any>;

/**
 * Format of a general plugin context object. This object defines
 * all keys that can be set via the `setContext` helper for a given
 * plugin instance.
 *
 * This should be defined within a `BasePlugin`, if applicable.
 *
 * By default, any keys that are not initially provided within
 * the BasePlugin class will fail validation.
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type PluginContext = Record<string, any>;

/**
 * List of registered plugins within the StratumService instance
 * and data/state associated with each plugin. Plugin data is
 * keyed by the plugin name which required to be unique for
 * a single service instance.
 */
export type RegisteredPlugins = {
  [key: string]: GenericPlugin;
};

/**
 * A "plugin factory" is a function that returns an
 * instantiated Plugin object.
 *
 * Use this PluginFactory type if your plugin either
 *   1. has no PluginOptions or
 *   2. options are not required to be specified
 *
 * When creating this function,
 *  - Provide your specific plugin class as T
 *  - Provide the plugin factory options as U. This may or
 *     may not be identical to the plugin options
 *
 * If the plugin does not have plugin options, set U
 * as type `never`.
 *
 * If at least one plugin option is required, use
 * `PluginFactoryWithRequiredOptions` instead.
 */
export type PluginFactory<T extends GenericPlugin, U extends PluginOptions = T['options']> = [U] extends [never]
  ? () => T
  : (options?: U) => T;

/**
 * A "plugin factory" is a function that returns an
 * instantiated Plugin object.
 *
 * Use this PluginFactory type if your plugin has
 * at least one required option that must be specified before
 * the plugin can be used.
 *
 * When creating this function,
 *  - Provide your specific plugin class as T
 *  - Provide the plugin factory options as U. This may or
 *     may not be identical to the plugin options
 *
 * If the plugin does not have plugin options, use `PluginFactory`
 * instead.
 */
export type PluginFactoryWithRequiredOptions<T extends GenericPlugin, U extends PluginOptions = T['options']> = (
  options: U
) => T;
