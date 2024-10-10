import { BasePublisherModel } from './base';
import type {
  AbTest,
  AbTestSchema,
  GenericPlugin,
  StratumEventListenerFn,
  StratumServiceOptions,
  TagKey,
  UserDefinedTagCatalogOptions,
  UserDefinedTagOptions
} from './types';
import { cloneStratumEvent, generateStratumEvent, populateDynamicTagOptions } from './utils';
import { generateCatalogId, RegisteredTagCatalog } from './utils/catalog';
import { addStratumEventListener, debugModeEnabled } from './utils/env';
import { Injector } from './utils/injector';
import { normalizeToArray } from './utils/types';

/**
 * The main Stratum service class. This class is the main entry point for the
 * functionality within this package.
 *
 * The functionality encapsulated by this class can be summarized as follows:
 *   1. Starts tag catalog validation on initialization and stores validated tag models
 *   2. Loads and instantiated publisher models on initialization
 *   3. Store global variables and configuration options that contain context-specific information and options
 *   4. Exposes functions for application to publish tags from tag catalog (via publisher models)
 *
 * Because the tag models and context variables are stored within the class. This class is intended
 * to operate in a singleton-scope. However, this is not strictly enforced.
 * Applications should use a single reference to the same StratumService instance
 * across their codebase.
 *
 * Different instances of the StratumService are generally independent from one another which can
 * provide advantages within unit testing and automation.
 */
export class StratumService {
  /**
   * Collection of tag catalogs registered by the stratum service
   * instance.
   */
  readonly catalogs: { [key: string]: RegisteredTagCatalog } = {};

  /**
   * Reference to a registered tag catalog within the main `catalogs`
   * object. The default tag catalog is a syntactic sugar to easily
   * reference the catalog registered on service instantiation.
   */
  defaultCatalog?: RegisteredTagCatalog;

  /**
   * List of publisher models that active for the instance of StratumService.
   * This list is populated from the determinePublishers method on instantiation.
   *
   * Additional entries can by added to this list via the publishers option in
   * StratumServiceOptions.
   */
  readonly publishers: BasePublisherModel[] = [];

  /**
   * Utility class that stores data that should be shared between
   * the Stratum service instance and underlying models.
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

    // Register the default catalog
    if (options.catalog) {
      const id = this.addCatalog(options.catalog);
      if (id) {
        this.defaultCatalog = this.catalogs[id];
      }
    }
  }

  /**
   * Register a new tag catalog within the service. On registration, tag catalog
   * validation and conversion into models occurs. the service will create a composite
   * catalog id for the catalog based on the provided metadata.
   *
   * If a unique catalog id can be generated, the catalog will end up in the
   * `catalogs` object, even if it fails validation. If a unique catalog id cannot
   * be generated, the catalog will not be registered.
   *
   * Tag catalogs registered via this function outside the constructor should reference
   * the catalog via the generated catalog id.
   *
   * Note: tag ids do not need to be unique across tag catalogs.
   *
   * @param {UserDefinedTagCatalogOptions} options - Tag catalog tags and optional catalog version
   * @return {string | undefined} Catalog id of newly registered catalog. Undefined if
   *   catalog has already been registered.
   */
  addCatalog(options: UserDefinedTagCatalogOptions): string {
    const id = generateCatalogId(options, this.injector.productName, this.injector.productVersion);
    if (this.catalogs[id]) {
      this.injector.logger.debug(`Unable to register duplicate catalog "${id}"`);
      return '';
    }
    this.catalogs[id] = new RegisteredTagCatalog(id, options, this.injector);
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
      delete this.injector.registeredTagIds[id];
    }
    if (this.defaultCatalog && this.defaultCatalog.id === id) {
      delete this.defaultCatalog;
    }
  }

  /**
   * Add a new publisher instance to the list of publishers managed
   * by the service.
   *
   * Once added, the publisher model will have its initialize lifecycle
   * event executed.
   *
   * Add a new publisher instance to the list of publishers managed
   * by the service. This can be used to conditionally add publishers
   * after the service has already been instantiated.
   *
   * @param {BasePublisherModel} model - Publisher model to register in the service
   */
  addPublisher(model: BasePublisherModel) {
    model.initialize(this.injector.getUniqueId(), this.injector);
    this.publishers.push(model);
  }

  /**
   * Remove publisher registered within the service
   * given a publisher model instance or id
   *
   * @param {BasePublisherModel | number} obj - Id or publisher model to remove from the service
   */
  removePublisher(obj: BasePublisherModel | number) {
    const id = typeof obj === 'number' ? obj : obj.id;
    const index = this.publishers.findIndex((publisher) => publisher.id === id);
    if (index < 0) {
      this.injector.logger.debug(`Unable to remove publisher "${id}" not registered within the service.`);
      return;
    }
    this.publishers.splice(index, 1);
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
      publishers.forEach((model) => {
        this.addPublisher(model);
      });

      // Execute plugin onRegister hook after we're done registering models and publishers
      plugin.onRegister(this.injector);
    });
  }

  /**
   * Publishes valid tags from the StratumService given a tag key and
   * context-specific options.
   *
   * This function is syntactic sugar for `publishFromCatalog` where the
   * catalog is implied to be the default tag catalog. If there is no
   * default tag catalog, this function will fail.
   *
   * @param {TagKey} key - Key of the default tag catalog
   * @param {Partial<UserDefinedTagOptions>} options - Additional options to apply to tag on publish
   * @return {Promise<boolean>} - This promise will always resolve with a boolean representing
   *  the success of the publishing logic
   */
  async publishTag(key: TagKey, options?: Partial<UserDefinedTagOptions>): Promise<boolean> {
    const catalogId = this.defaultCatalog?.id ?? '';
    return this.publishFromCatalog(catalogId, key, options);
  }

  /**
   * Publishes valid tags from the StratumService given a tag key and
   * context-specific options.
   *
   * Each tag is sent to sequentially to each model in the publishers list, queuing
   * a separate microtask for each publisher.
   *
   * Logic for each publisher:
   * 1. Check `shouldPublishTag` on publisher model. This allows publishers to implement their own
   * custom logic to filter tags based on the underlying tag model properties. A microtask is not
   * queued if this check does not pass.
   * 2. Check `isAvailable` on publisher model. If unavailable, the publisher is skipped.
   * 3. Map the tag content to a format that can be sent to the publisher.
   * 3. Send mapped tag content to the publisher model's `publish` method.
   *
   * @param {string} catalogId - Id of catalog to publish search for the key from
   * @param {TagKey} key - Key of tag catalog entry to publish
   * @param {Partial<UserDefinedTagOptions>} options - Additional options to apply to tag on publish
   * @return {Promise<boolean>} - This promise will always resolve with a boolean representing
   *  the success of the publishing logic
   */
  async publishFromCatalog(catalogId: string, key: TagKey, options?: Partial<UserDefinedTagOptions>): Promise<boolean> {
    const catalog = this.catalogs[catalogId];
    if (!catalog || !catalog.validTags[key]) {
      this.injector.logger.debug(`Unable to publish tag: key "${key}" does not correspond to a valid tag`);
      return Promise.resolve(false);
    }

    const tag = catalog.validTags[key];

    // Determine event publishers
    const publishers = this.publishers.filter((publisher) => publisher.shouldPublishTag(tag));

    // Generate atomic event
    const event = generateStratumEvent(this.injector, tag, catalog, publishers, options);

    /**
     * This will only attempt to log to console if auto logging
     * is enabled.
     */
    this.injector.logger.autoLog('publish', event);

    /**
     * Generate a Stratum event and pass it to any waiting event listeners,
     * if any. This is used for asynchronous event subscriptions.
     */
    if (debugModeEnabled()) {
      queueMicrotask(() => {
        const fns = this.injector.getExternalEventListeners();
        fns.forEach((fn) => {
          fn(event);
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
     * a success or `false` given a failure. This is meant to ensure backwards compatibility
     * with existing integrations.
     */
    return Promise.all(
      publishers.map(
        (publisher) =>
          new Promise<void>((resolve, reject) => {
            queueMicrotask(async () => {
              const internalEvent = cloneStratumEvent(event);
              internalEvent.tagOptions = populateDynamicTagOptions(publisher, options);
              const isAvailable = await publisher.isAvailable(tag, internalEvent);
              if (isAvailable) {
                const content = publisher.getTagOutput(tag, internalEvent);
                await publisher.publish(content, internalEvent);
                resolve();
              } else {
                this.injector.logger.debug(
                  `Publisher "${publisher.name}" is not available. ${tag.displayableName} not published.`
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
   * Helper function to add a Stratum event listener callback
   * function to the global this object, if available.
   *
   * The provided function will be executed each time the
   * Stratum service instance publishes a tag.
   */
  addEventListener(fn: StratumEventListenerFn): boolean {
    return addStratumEventListener(this.id, fn);
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
