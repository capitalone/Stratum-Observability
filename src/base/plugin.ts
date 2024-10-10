import { PluginContext, PluginOptions } from '../types';
import { Injector } from '../utils';
import { BaseTagModel } from './model';
import { BasePublisherModel } from './publisher';

/**
 * A plugin is composed of one or more custom tag models (with
 * tag catalog entries) and publisher models.
 *
 * Plugins can be used to leverage the tag catalog functionality
 * in a new way or to override the default behavior of default
 * tags/publishers.
 *
 * New plugins should avoid exporting Plugin objects directly
 * and use a PluginFactory definition to do so.
 */
export abstract class BasePlugin<T extends PluginContext, U extends PluginOptions> {
  /**
   * Short name of the plugin. This value must be unique
   * for all plugins passed into the service instance.
   *
   * This value is used to specify custom dynamic data to
   * pass to plugin publishers via TagOptions.pluginData.
   */
  abstract name: string;

  /**
   * One or more publisher models to register within the
   * service. The publishers will only accept tags from
   * the given eventTypes.
   */
  publishers?: BasePublisherModel[];

  /**
   * Mapping of eventTypes strings in plugin tags to
   * respective tag model.
   *
   * If defined as:
   * ```
   * {
   *   simple: SimpleTagModel
   * }
   * ```
   *
   * then any tag entry with `eventType: 'simple'` will
   * will be added to the service as a SimpleTagModel
   * instance.
   */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  eventTypes?: { [key: string]: typeof BaseTagModel<any> };

  /**
   * Additional options to pass into the plugin on
   * initialization, if any.
   * Supported values are dependent on the individual plugin.
   */
  options!: U;

  /**
   * Additional context vars that can be set at runtime
   * to collect context-specific metadata via
   * `setContext`
   *
   * Only keys defined within this object are allowed
   * to be passed into `setContext`
   */
  context!: T;

  /**
   * Flag to indicate whether the plugin should apply a prefix
   * to all context keys when loaded into the global context
   * object at publish.
   *
   * The global context is a collection of all
   * plugin context vars active on the stratum
   * service instance. Plugins may use this data to be
   * context-aware even when a specific plugin does not apply to
   * the tag being published.
   */
  useGlobalContextPrefix = true;

  /**
   * If useGlobalContextPrefix is true, this value defines
   * the prefix to apply to all context keys.
   *
   * If undefined (default), the plugin's name will be used.
   *
   * Prefixes are delimited by an underscore when applied.
   */
  globalContextPrefix: string | undefined;

  /**
   * Helper method to set particular context var value stored by the plugin.
   * @param {K} key - Key of variable name
   * @param {T[K]} value - Value to apply to variable
   * @return {boolean} Flag indicating whether the variable was set successfully
   */
  setContext<K extends keyof T>(key: K, value: T[K]): boolean {
    if (!this.context || !(key in this.context)) {
      return false;
    }
    this.context[key] = value;
    return true;
  }

  /**
   * Helper method to get a particular context var stored by
   * the plugin.
   *
   * @property {K} key - Key of variable name
   * @return {T[K]} the value of the variable
   */
  getContext<K extends keyof T>(key: K): T[K] {
    return this.context[key];
  }

  /**
   * Hook to execute when the plugin instance is registered by the
   * StratumService. Can be used to provide additional context
   * to the plugin or to perform any additional setup.
   *
   * @property {Injector} injector - Stratum service injector instance
   */
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  onRegister(_injector: Injector) {
    // Do nothing by default
  }
}
