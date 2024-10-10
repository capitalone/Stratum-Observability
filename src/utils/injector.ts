import { BasePublisherModel, BaseTagModel } from '../base';
import { GLOBAL_LISTENER_KEY } from '../constants';
import type { GenericPlugin, RegisteredPlugins, StratumEventListenerFn, TagId, TagTypeModelMap } from '../types';
import { AbTestManager } from './ab-test-manager';
import { debugModeEnabled, generateDefaultSessionId, Logger } from './env';
import { normalizeToArray } from './types';

/**
 * DI-like utility class that is created in the Stratum service.
 * This class instance serves as a singleton within each service instance and
 * is passed into child publisher and tag models.
 *
 * Contains any shared data that should be accessible across the service instance
 * lifetime.
 */
export class Injector {
  /**
   * Stratum library version available as metadata to events published
   * from the service.
   *
   * The static key is replaced by Rollup with the dynamic package.json
   * version at compile.
   */
  readonly version = '__stratumLibraryVersion__';

  /**
   * Internal counter used to generate unique ids of publishers models registered
   * within the service.
   */
  private n = 0;

  /**
   * Map of tag type (eventType) to associated TagModel class to
   * instantiate tags on validation.
   *
   * As tag types are provided via plugins, they are
   * added to this mapping.
   */
  readonly tagTypeModelMap: TagTypeModelMap = {
    base: { model: BaseTagModel }
  };

  /**
   * Shared instance of the Logger class. This reference contains the
   * Logger that should be used for debugging/logging within the particular StratumService
   * instance.
   */
  readonly logger: Logger;

  /**
   * AbTestManager instance that stores all registered AbTest objects
   * active within Stratum.
   */
  readonly abTestManager: AbTestManager = new AbTestManager();

  /**
   * Map of plugin names and options currently registered within
   * the service.
   *
   * If a plugin does not provide options, an empty object `{}`
   * is stored in this map.
   */
  plugins: RegisteredPlugins = {};

  /**
   * Stored session id that can be used to uniquely
   * identify user sessions across multiple published events.
   *
   * By default, the session id is a uuid that is
   * persisted within browser session storage.
   */
  stratumSessionId: string;

  /**
   * List of tag ids registered via `registerTagId`. Tag
   * ids are registered if/when a valid model is generated
   * by the Stratum Service on initialization.
   */
  registeredTagIds: {
    [key: string]: {
      [key: TagId]: true;
    };
  } = {};

  /**
   * Name of the application that is implementing Stratum.
   * This is a required value and is automatically populated based on
   * the respective value in StratumServiceOptions.
   */
  productName: string;

  /**
   * Version of the application that is implementing Stratum.
   * This is a required value and is automatically populated based on the
   * respective value in StratumServiceOptions.
   */
  productVersion: string;

  constructor(productName: string, productVersion: string) {
    this.productName = productName;
    this.productVersion = productVersion;
    this.logger = new Logger();
    this.stratumSessionId = generateDefaultSessionId();
  }

  /**
   * Given a tag id, add it to the list of
   * registered ids, if it does not already exist.
   */
  registerTagId(catalogId: string, tagId: TagId) {
    if (!(catalogId in this.registeredTagIds)) {
      this.registeredTagIds[catalogId] = {};
    }
    this.registeredTagIds[catalogId][tagId] = true;
  }

  /**
   * Returns whether the given tag id has already
   * been registered by the Stratum instance.
   */
  isTagIdRegistered(catalogId: string, tagId: TagId): boolean {
    return !!this.registeredTagIds[catalogId] && tagId in this.registeredTagIds[catalogId];
  }

  /**
   * Register a plugin and associated models.
   *
   * This function is responsible for populating new eventTypes within tagTypeModelMap
   * returns a flat list of publishers models that need to be registered within the service.
   *
   * For each publisher model:
   *   1. Attaches the respective `pluginName` value to the property of the instance
   *   2. Overrides the acceptedTagModels property of the instance to restrict received
   *       tags to only those provided by the plugin.
   *
   * @param {GenericPlugin} plugin - Plugin to register
   * @return Plugin output
   */
  registerPlugin(plugin: GenericPlugin): { publishers: BasePublisherModel[] } {
    const publishers: BasePublisherModel[] = [];
    const acceptedTagModels: (typeof BaseTagModel)[] = [];

    if (!plugin.name || plugin.name in this.plugins) {
      this.logger.debug(`Unable to register plugin with duplicate name "${plugin.name}"`);
      return { publishers };
    }

    this.plugins[plugin.name] = plugin;

    if (plugin.eventTypes) {
      for (const [eventType, model] of Object.entries(plugin.eventTypes)) {
        if (eventType in this.tagTypeModelMap) {
          this.logger.debug(`Unable to register plugin eventType with duplicate name "${eventType}"`);
        } else {
          this.tagTypeModelMap[eventType] = { pluginName: plugin.name, model };
          acceptedTagModels.push(model);
        }
      }
    }

    normalizeToArray(plugin.publishers).forEach((publisher) => {
      /**
       * If acceptedTagModels array is not specified, restrict acceptedTagModels of
       * each publisher to the plugin's tag models.
       */
      if (!Array.isArray(publisher.acceptedTagModels)) {
        publisher.acceptedTagModels = acceptedTagModels;
      }
      publisher.pluginName = plugin.name;
      publishers.push(publisher);
    });

    return { publishers };
  }

  /**
   * Get Stratum dynamic event listener functions attached to the global parent, if any.
   * Event listeners are either namespaced by the generated Stratum id or
   * available globally for all Stratum instances to execute.
   *
   * If debug mode is not enabled on the global parent, this function
   * will always return an empty array
   */
  getExternalEventListeners(): StratumEventListenerFn[] {
    if (!debugModeEnabled()) {
      return [];
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const g = globalThis as any;
    const scopedKey = `stratum_config_${this.productName}`;
    return [
      ...(Array.isArray(g[GLOBAL_LISTENER_KEY]?.listeners) ? g[GLOBAL_LISTENER_KEY].listeners : []),
      ...(Array.isArray(g[scopedKey]?.listeners) ? g[scopedKey].listeners : [])
    ];
  }

  /**
   * Internal helper function to generate a unique id, used throughout
   * the service.
   */
  getUniqueId(): number {
    return ++this.n;
  }
}
