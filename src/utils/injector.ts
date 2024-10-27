import { BasePublisher, BaseEventModel } from '../base';
import { GLOBAL_LISTENER_KEY } from '../constants';
import type { GenericPlugin, RegisteredPlugins, StratumSnapshotListenerFn, CatalogItemId, EventTypeModelMap } from '../types';
import { AbTestManager } from './ab-test-manager';
import { generateDefaultSessionId, Logger } from './env';
import { normalizeToArray } from './general';

/**
 * DI-like utility class that is created in the Stratum service.
 * This class instance serves as a singleton within each service instance and
 * is passed into registered publishers and event models.
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
   * Map of event type to aan EventModel class used to
   * instantiate catalog items on validation.
   *
   * As event types are registered via plugins, they are
   * added to this mapping.
   */
  readonly eventTypeModelMap: EventTypeModelMap = {
    base: { model: BaseEventModel }
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
   * List of catalog item ids registered via `registerCatalogItemId`.
   * Ids are registered if/when a valid model is generated
   * by the Stratum Service on initialization.
   */
  registeredCatalogItemIds: {
    [key: string]: {
      [key: CatalogItemId]: true;
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
   * Given a catalog item id, add it to the list of
   * registered ids, if it does not already exist.
   */
  registerCatalogItemId(catalogId: string, id: CatalogItemId) {
    if (!(catalogId in this.registeredCatalogItemIds)) {
      this.registeredCatalogItemIds[catalogId] = {};
    }
    this.registeredCatalogItemIds[catalogId][id] = true;
  }

  /**
   * Returns whether the given catalog item id has already
   * been registered by the Stratum instance.
   */
  isCatalogItemIdRegistered(catalogId: string, id: CatalogItemId): boolean {
    return !!this.registeredCatalogItemIds[catalogId] && id in this.registeredCatalogItemIds[catalogId];
  }

  /**
   * Register a plugin and underlying models/publishers.
   *
   * This function is responsible for populating new eventTypes within eventTypeModelMap
   * returns a flat list of publishers that need to be registered within the service.
   *
   * For each publisher model:
   *   1. Attaches the respective `pluginName` value to the property of the instance
   *   2. Overrides the acceptedEventModels property of the instance to restrict received
   *       event models to only those provided by the plugin.
   *
   * @param {GenericPlugin} plugin - Plugin to register
   * @return Plugin output
   */
  registerPlugin(plugin: GenericPlugin): { publishers: BasePublisher[] } {
    const publishers: BasePublisher[] = [];
    const acceptedEventModels: (typeof BaseEventModel)[] = [];

    if (!plugin.name || plugin.name in this.plugins) {
      this.logger.debug(`Unable to register plugin: duplicate name "${plugin.name}"`);
      return { publishers };
    }

    this.plugins[plugin.name] = plugin;

    if (plugin.eventTypes) {
      for (const [eventType, model] of Object.entries(plugin.eventTypes)) {
        if (eventType in this.eventTypeModelMap) {
          this.logger.debug(`Unable to register plugin eventType: duplicate name "${eventType}"`);
        } else {
          this.eventTypeModelMap[eventType] = { pluginName: plugin.name, model };
          acceptedEventModels.push(model);
        }
      }
    }

    normalizeToArray(plugin.publishers).forEach((publisher) => {
      /**
       * If acceptedEventModels array is not specified, restrict acceptedEventModels of all
       * publishers to the plugin-specific events models.
       */
      if (!Array.isArray(publisher.acceptedEventModels)) {
        publisher.acceptedEventModels = acceptedEventModels;
      }
      publisher.pluginName = plugin.name;
      publishers.push(publisher);
    });

    return { publishers };
  }

  /**
   * Get Stratum dynamic snapshot listener functions attached to globalThis, if any.
   * These listeners are either namespaced by the StratumService id or
   * available globally for all Stratum instances to execute.
   */
  getExternalSnapshotListeners(): StratumSnapshotListenerFn[] {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const g = globalThis as any;
    const scopedKey = `stratum_config_${this.productName}`;
    return [
      ...(Array.isArray(g[GLOBAL_LISTENER_KEY]?.listeners) ? g[GLOBAL_LISTENER_KEY].listeners : []),
      ...(Array.isArray(g[scopedKey]?.listeners) ? g[scopedKey].listeners : [])
    ];
  }
}
