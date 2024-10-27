import type { BaseEventModel } from '../base';
import type { AbTestSchema } from './ab-test';

/**
 * Types that can be used to define the required
 * id property in catalog items.
 */
export type EventId = number | string;

/**
 * Union of types that can be used to reference items
 * within a stratum catalog.
 */
export type CatalogKey = number | string;

/**
 * Base definition of objects within a stratum catalog. All catalog
 * items should extend this interface.
 */
export interface CatalogEvent<EventType extends string = string> {
  /**
   * Type of event this catalog item describes. The eventType determines the
   * contents used in publishing as well as the validation rules that
   * are used to validate the catalog item.
   */
  eventType: EventType;

  /**
   * Description with additional information about the specific catalog item
   * and its usage
   */
  description: string;

  /**
   * Unique identifier for the item within the catalog
   */
  id: EventId;
}

/**
 * Collection of CatalogEvents keyed by a CatalogKey.
 *
 * For improved type hinting, explicitly define the catalog item
 * interfaces via the generic property.
 */
export type StratumCatalog<T extends CatalogEvent = CatalogEvent<'base'>> = { [key in CatalogKey]: T };

/**
 * List of keys associated with invalid catalog items determined during
 * validation. An item is invalid if its associated model validation
 * rules fail. The model is provided by a plugin and mapped to the event type.
 */
export type CatalogErrors = {
  /**
   * List of validation errors encountered when attempting to validate
   * the underlying catalog item data.
   */
  [key in CatalogKey]: {
    errors: string[];
  };
};

/**
 * Collection of metadata that is used to describe a stratum catalog. All
 * properties within this interface are optional - if not provided,
 * the library will derive them.
 */
export interface CatalogMetadata {
  /**
   * The specific version of the stratum catalog. Defaults to an empty string
   * if not provided.
   */
  catalogVersion: string;

  /**
   * The name of the component or shared library responsible for
   * publishing a catalog's items. This can be used to denote cases where
   * Stratum is initialized separately from the event publishing logic.
   *
   * If unspecified, this defaults to the productName.
   */
  componentName: string;

  /**
   * The version of the component or shared library responsible for
   * publishing a catalog's items. This can be used to denote cases where
   * Stratum is initialized separately from the event publishing logic.
   *
   * If unspecified, this defaults to the productVersion.
   */
  componentVersion: string;
}

/**
 * User-definable stratum catalog options that can be specified by consuming apps.
 * All metadata is optional but the catalog itself is required.
 */
export interface UserDefinedCatalogOptions<T extends CatalogEvent = CatalogEvent> extends Partial<CatalogMetadata> {
  /**
   * Collection of catalog items to import into stratum.
   */
  items: StratumCatalog<T>;
}

/**
 * The available catalog options that define the "default stratum catalog" on
 * initialization of the StratumService
 */
export interface DefaultCatalogOptions<T extends CatalogEvent = CatalogEvent>
  extends Partial<Pick<CatalogMetadata, 'catalogVersion'>> {
  /**
   * Collection of catalog items to import into stratum.
   */
  items: StratumCatalog<T>;
}

/**
 * A stratum catalog is made up of a collection of items and associated
 * catalog metadata. All fields in a catalog are required, but the metadata can
 * has default values and does not necessarily have to be defined by the user
 */
export type CatalogOptions<T extends CatalogEvent = CatalogEvent> = Required<UserDefinedCatalogOptions<T>>;

/**
 * Context-specific options that are used to dynamically alter catalog item data
 * during publishing. Typically these values are used to provide dynamic
 * data to static catalog items.
 */
export interface EventOptions {
  /**
   * A/B test schemas to attach to this specific catalog item publish
   */
  abTestSchemas: AbTestSchema | AbTestSchema[];

  /**
   * Key-value mapping of dynamic placeholder name to associated
   * value.
   *
   * @example
   * A replacement map of { 'abc123': 'xyz' } will replace all dynamic
   * placeholders within the catalog item matching "{{abc123}}" with the given
   * value of "xyz"
   */
  replacements: { [key: string]: EventReplacement };

  /**
   * Generic catch-all for additional data to be sent to plugin
   * events when a catalog item is published.
   *
   * The format of this object entries should be:
   *    "pluginName" => \\{ pluginSpecificData \\}
   *
   * Note: This keyed data is only made available to publishers loaded
   * via the plugin matching the key-value.
   *
   * When passed in via StratumService.publish, the data will be
   * available via the options.data argument in the getModelOutput()
   * function of the publisher.
   *
   * **Basic usage:**
   *
   * Initialize plugin and integrate into the service instance
   * ```
   * const simplePlugin = new Plugin({
   *    name: 'mySimplePluginName',
   *    publishers: new MySimplePublisher(),
   *    eventTypes: {
   *      simpleEvent: SimpleModel
   *    }
   * })
   * ```
   *
   * Publish catalog item and optionally pass dynamic data to publishers
   * ```
   * stratum.publish(CatalogKey.EXAMPLE_ITEM, {
   *   pluginData: {
   *      mySimplePluginName: {
   *          foo: 'bar'
   *      }
   *   }
   * })
   * ```
   *
   * Receive dynamic data, if any, in publisher model
   * ```
   * // In SimpleModel
   * getModelOutput(model: BaseEventModel, options?: Partial<EventOptions>) {
   *   // Expected value { foo: 'bar' }
   *   console.log(options.data);
   * }
   * ```
   *
   * No guarantees of the existence or format of this data are made.
   * It's a good idea to validate the incoming data within your publisher
   * before using it.
   */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  pluginData: { [key: string]: any };

  /**
   * NOTE: Do not specify directly in options passed into StratumService.publish!
   *
   * This is a special derived field that is populated when sending data to publishers
   * sourced from the plugin name specified in `pluginData`
   */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  data: any;
}

/**
 * Derived as a subset of catalog item options, this defines the rules that
 * CAN be specified when passing options to StratumService.publish
 *
 * Specifically, we are excluding the `data` EventOptions property since
 * this is dynamically generated.
 */
export type UserDefinedEventOptions = Omit<EventOptions, 'data'>;

/**
 * Optional function that can be used to replace a dynamic placeholder
 * taking into account the event context.
 */
export type EventReplacementFn = (model: BaseEventModel) => string;

/**
 * Composite type that defines possible options of inputs
 * for the EventOptions.replacement property.
 */
export type EventReplacement = string | EventReplacementFn | boolean | number;

/**
 * Map of event type to an associated EventModel class to
 * instantiate catalog item on validation.
 *
 * If an EventModel is loaded into the map from a plugin, the pluginName
 * is specified.
 */
export interface EventTypeModelMap {
  [key: string]: {
    pluginName?: string;
    model: typeof BaseEventModel;
  };
}
