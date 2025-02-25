import { BasePublisher } from './base';
import type {
  AbTest,
  AbTestSchema,
  CatalogKey,
  GenericPlugin,
  StratumServiceOptions,
  StratumSnapshotListenerFn,
  UserDefinedCatalogOptions,
  UserDefinedEventOptions
} from './types';
import { cloneStratumSnapshot, generateStratumSnapshot, populateDynamicEventOptions, GlobalPlugins } from './utils';
import { generateCatalogId, RegisteredStratumCatalog } from './utils/catalog';
import { addStratumSnapshotListener } from './utils/env';
import { normalizeToArray } from './utils/general';
import { Injector } from './utils/injector';

/**
 * The main Stratum service class. This class is the main entry point for the
 * functionality within this package.
 *
 * The functionality encapsulated by this class can be summarized as follows:
 *   1. Starts default catalog validation on initialization and creates event model instances
 *   2. Loads and instantiates publishers on initialization
 *   3. Store global variables and globl stratum context info
 *   4. Exposes functions for application to publish from catalogs and register plugins
 *
 * This class is designed to operate in a singleton-scope. However, this is dependent on use case.
 * We recommend that applications use a single reference to the same StratumService instance
 * across their codebase to avoid syncing data across service instances.
 *
 * Different instances of the StratumService are independent from one another which is useful
 * for testing and implementation.
 */
export class StratumService {
  /**
   * Collection of catalogs registered by the StratumService
   * instance.
   */
  readonly catalogs: { [key: string]: RegisteredStratumCatalog } = {};

  /**
   * Reference to a registered catalog within the main `catalogs`
   * object. The default catalog is a syntactic sugar to easily
   * reference the catalog registered on service instantiation.
   */
  defaultCatalog?: RegisteredStratumCatalog;

  /**
   * The list of publishers that are active for the specific
   * StratumService instance via plugin registration.
   */
  readonly publishers: BasePublisher[] = [];

  /**
   * Utility class that stores data that is intended to be shared between
   * the StratumService instance and underlying models and plugins.
   */
  readonly injector: Injector;

  /**
   * Initializes the StratumService class. On initialization, the following
   * processes occur:
   *  1. Set up default state for the service including global context data
   *  1. Register plugins, if any
   *  3. Register the default catalog, if any
   *
   * Typically, this is done using a singleton pattern. In most cases, you should have one
   * instance of the service per application.
   *
   * @param {StratumServiceOptions} options - Incoming options used to initialize StratumService
   */
  constructor(options: StratumServiceOptions) {
    this.injector = new Injector(options.productName, options.productVersion);

    if (options.plugins) {
      this.addPlugin(options.plugins);
    }

    // register global plugins first if any exists
    if (GlobalPlugins.plugins) {
      this.addPlugin(GlobalPlugins.plugins);
    } // if

    // Register the default catalog
    if (options.catalog) {
      const id = this.addCatalog(options.catalog);
      if (id) {
        this.defaultCatalog = this.catalogs[id];
      }
    }
  }

  /**
   * Register a new catalog within the service. On registration, the catalog
   * validation and conversion into models occurs. the service will create a composite
   * catalog id for the catalog based on the provided metadata.
   *
   * If a unique catalog id can be generated, the catalog will end up in the
   * `catalogs` object, even if it fails validation. If a unique catalog id cannot
   * be generated, the catalog will not be registered.
   *
   * Catalogs registered via this function outside the constructor should reference
   * the catalog via the generated catalog id.
   *
   * Note: catalog item ids do not need to be unique across catalogs.
   *
   * @param {UserDefinedCatalogOptions} options - Catalog items and optional catalog version
   * @return {string | undefined} Catalog id of newly registered catalog. Undefined if
   *   catalog has already been registered.
   */
  addCatalog(options: UserDefinedCatalogOptions): string {
    const id = generateCatalogId(options, this.injector.productName, this.injector.productVersion);
    if (this.catalogs[id]) {
      this.injector.logger.debug(`Unable to register duplicate catalog "${id}"`);
      return '';
    }
    this.catalogs[id] = new RegisteredStratumCatalog(id, options, this.injector);
    return id;
  }

  /**
   * Remove a registered catalog given a catalog id
   *
   * @property {string} id - Catalog id to remove
   */
  removeCatalog(id: string) {
    if (id in this.catalogs) {
      delete this.catalogs[id];
      delete this.injector.registeredEventIds[id];
    }
    if (this.defaultCatalog && this.defaultCatalog.id === id) {
      delete this.defaultCatalog;
    }
  }

  /**
   * Register a plugin within stratum.
   * This function registers the new plugins' publishers and event types.
   *
   * @param {GenericPlugin | GenericPlugin[]} plugins - Incoming plugins to register in the service
   */
  addPlugin(plugins: GenericPlugin | GenericPlugin[]) {
    normalizeToArray(plugins).forEach((plugin) => {
      const { publishers } = this.injector.registerPlugin(plugin);
      publishers.forEach((publisher) => {
        publisher.onInitialize(this.injector);
        this.publishers.push(publisher);
      });
      // Execute plugin onRegister hook after we're done registering models and publishers
      plugin.onRegister(this.injector);
    });
  }

  /**
   * Publishes valid catalog items StratumService given a catalog key and
   * (optional) context-specific event options.
   *
   * This function is syntactic sugar for `publishFromCatalog` where the
   * catalog is implied to be the default catalog. If there is no
   * default catalog, this function will fail.
   *
   * @param {CatalogKey} key - Key within the default catalog
   * @param {Partial<UserDefinedEventOptions>} options - Additional options to apply to the specific publish action
   * @return {Promise<boolean>} - This promise will always resolve with a boolean representing
   *  the success of the publisher
   */
  async publish(key: CatalogKey, options?: Partial<UserDefinedEventOptions>): Promise<boolean> {
    const catalogId = this.defaultCatalog?.id ?? '';
    return this.publishFromCatalog(catalogId, key, options);
  }

  /**
   * Publishes valid catalog items StratumService given a catalog key and
   * (optional) context-specific event options.
   *
   * The model corresponding to the key provided is sent to sequentially to each model
   * in the publishers list, queuing a separate microtask for each publisher.
   *
   * Logic for each publisher:
   * 1. Check `shouldPublishEvent`. This allows publishers to implement their own
   * custom logic to filter event models based on the underlying model data. A microtask is not
   * queued if this check does not pass.
   * 2. Check `isAvailable`. If unavailable, the publisher is skipped.
   * 3. Map the model content to a format that can be sent to the publisher.
   * 3. Send mapped content to the publisher's `publish` method.
   *
   * @param {string} catalogId - Id of catalog to publish search for the key from
   * @param {CatalogKey} key - Key of catalog item to publish
   * @param {Partial<UserDefinedEventOptions>} options - Additional options to apply on publish
   * @return {Promise<boolean>} - This promise will always resolve with a boolean representing
   *  the success of the publisher
   */
  async publishFromCatalog(
    catalogId: string,
    key: CatalogKey,
    options?: Partial<UserDefinedEventOptions>
  ): Promise<boolean> {
    const catalog = this.catalogs[catalogId];
    if (!catalog || !catalog.validModels[key]) {
      this.injector.logger.debug(`Unable to publish "${key}": key not found or invalid`);
      return Promise.resolve(false);
    }

    const model = catalog.validModels[key];

    // Determine event publishers
    const publishers = this.publishers.filter((publisher) => publisher.shouldPublishEvent(model));

    // Generate an atomic Stratum snapshot
    const snapshot = generateStratumSnapshot(this.injector, model, catalog, publishers, options);

    /**
     * Pass the snapshot it to any global snapshot listeners
     */
    const fns = this.injector.getExternalSnapshotListeners();
    if (fns.length) {
      queueMicrotask(() => {
        fns.forEach((fn) => {
          fn(snapshot);
        });
      });
    }

    /**
     * No publishers = nothing to do
     */
    if (!publishers.length) {
      return Promise.resolve(true);
    }

    /**
     * Wait for all promises to resolve/reject. In this case we're looping over the
     * registered publishers to queue up tasks, which either resolves with `true` given
     * a success or `false` given a failure.
     */
    return Promise.all(
      publishers.map(
        (publisher) =>
          new Promise<void>((resolve, reject) => {
            queueMicrotask(async () => {
              const internalSnapshot = cloneStratumSnapshot(snapshot);
              internalSnapshot.eventOptions = populateDynamicEventOptions(publisher, options);
              const isAvailable = await publisher.isAvailable(model, internalSnapshot);
              if (isAvailable) {
                const content = publisher.getEventOutput(model, internalSnapshot);
                await publisher.publish(content, internalSnapshot);
                resolve();
              } else {
                this.injector.logger.debug(
                  `Unable to publish "${key}": Publisher "${publisher.name}" is not available`
                );
                reject();
              }
            });
          })
      )
    )
      .then(() => true) // Explicitly resolve return true given all were successful
      .catch(() => false); // Explicitly resolve return false if any were rejected
  }

  /**
   * Shortcut functions
   */

  /**
   * Helper function to add a Stratum snapshot listener callback
   * function to the globalThis object, if available.
   *
   * The provided function will be executed each time the
   * StratumService instance publishes an event.
   */
  addSnapshotListener(fn: StratumSnapshotListenerFn): boolean {
    return addStratumSnapshotListener(this.id, fn);
  }

  /**
   * Helper method to return the Stratum instance id set by the service
   * on initialization.
   */
  get id(): string {
    return this.injector.productName;
  }

  /**
   * Returns a list of all AbTests registered in Stratum
   */
  get abTests(): AbTest[] {
    return this.injector.abTestManager.tests;
  }

  /**
   * Register a new AbTest within Stratum.
   *
   * @param {AbTestSchema} obj - Data of AB test to register
   * @return Registered AbTest object within Stratum
   */
  startAbTest(obj: AbTestSchema): AbTest {
    return this.injector.abTestManager.startAbTest(obj);
  }

  /**
   * End an ongoing AbTest within Stratum
   *
   * @param {string | AbTest} key - The auto-generated AbTest id or AbTest object
   */
  endAbTest(key: string | AbTest) {
    this.injector.abTestManager.endAbTest(key);
  }

  /**
   * End all ongoing AbTests within Stratum
   */
  endAllAbTests() {
    this.injector.abTestManager.endAllAbTests();
  }

  /**
   * Returns the stratum session id currently stored by
   * Stratum
   */
  get stratumSessionId(): string {
    return this.injector.stratumSessionId;
  }

  /**
   * Returns the Stratum library version
   */
  get version(): string {
    return this.injector.version;
  }
}
