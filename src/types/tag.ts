import type { BaseTagModel } from '../base';
import type { AbTestSchema } from './ab-test';

/**
 * Types that can be used to define the required
 * tag id property in tag objects.
 */
export type TagId = number | string;

/**
 * Union of types that can be used to reference tags
 * within a tag catalog.
 */
export type TagKey = number | string;

/**
 * Base definition of items within the tag catalog. All tag
 * objects should extend this interface.
 */
export interface TagObject<EventType extends string = string> {
  /**
   * Type of event this tag describes. This eventType determines the
   * tag contents on publishing as well as the validation rules that
   * are used to validate the tag object.
   */
  eventType: EventType;

  /**
   * Tag metadata
   * Tag description with additional information about the tag and its usage
   */
  tagDescription: string;

  /**
   * Tag metadata
   * Unique identifier for tag within your application.
   */
  tagId: TagId;
}

/**
 * Collection of TagObjects keyed by a TagKey.
 *
 * For improved type hinting, explicitly define the internal tag object
 * interfaces via the generic property.
 */
export type TagCatalog<T extends TagObject = TagObject<'base'>> = { [key in TagKey]: T };

/**
 * List of keys associated with invalid tag entries determined during tag
 * validation. A tag is invalid if its associated tag model validation
 * rules fail. The tag model is provided by a plugin and mapped to the EventType.
 */
export type TagCatalogErrors = {
  [key in TagKey]: {
    /**
     * Human-readable label of the tag. Contains the tag key and additional
     * information like tag id and event type.
     */
    displayableName: string;

    /**
     * List of validation errors encountered when attempting to validate th
     * the underlying tag model.
     */
    errors: string[];
  };
};

/**
 * Collection of metadata that is used to describe a tag catalog. All
 * properties within this interface are optional - if not provided,
 * the library will derive them.
 */
export interface TagCatalogMetadata {
  /**
   * The specific version of the tag catalog. Defaults to an empty string
   * if not provided.
   */
  catalogVersion: string;

  /**
   * The name of the (web) component or shared library responsible for
   * publishing tags. This can identify cases where Stratum is initialized
   * separately from the publishing logic.
   *
   * If unspecified, this defaults to the productName.
   */
  componentName: string;

  /**
   * The version of the (web) component or shared library responsible for
   * publishing tags. This can identify cases where Stratum is initialized
   * separately from the publishing logic.
   *
   * If unspecified, this defaults to the productVersion.
   */
  componentVersion: string;
}

/**
 * User-definable tag catalog options that can be specified by the consuming apps.
 * All metadata is optional but the catalog itself is required.
 */
export interface UserDefinedTagCatalogOptions<T extends TagObject = TagObject> extends Partial<TagCatalogMetadata> {
  /**
   * Collection of tag objects to import into stratum.
   */
  tags: TagCatalog<T>;
}

/**
 *
 */
export interface DefaultTagCatalogOptions<T extends TagObject = TagObject>
  extends Partial<Pick<TagCatalogMetadata, 'catalogVersion'>> {
  /**
   * Collection of tag objects to import into stratum.
   */
  tags: TagCatalog<T>;
}

/**
 * A tag catalog is made up of a collection of tag objects and associated
 * tag catalog metadata. All fields in a catalog a required, but the metadata can
 * has default values and does not necessarily have to be defined by the user
 */
export type TagCatalogOptions<T extends TagObject = TagObject> = Required<UserDefinedTagCatalogOptions<T>>;

/**
 * Context-specific tag options used to dynamically alter tag contents
 * during publishing. Typically these values are used to provide dynamic
 * data to static TagCatalog items.
 */
export interface TagOptions {
  /**
   * One or more A/B test schemas to attach to this specific published
   * tag.
   */
  abTestSchemas: AbTestSchema | AbTestSchema[];

  /**
   * Key-value mapping of dynamic placeholder name to associated
   * value.
   *
   * @example
   * A replacement map of { 'abc123': 'xyz' } will replace all dynamic
   * placeholders within the tag matching "${abc123}" with the given
   * value of "xyz"
   */
  replacements: { [key: string]: TagOptionReplacement };

  /**
   * Generic catch-all for additional data to be sent to plugin
   * tags when a tag key is published by the service.
   *
   * The format of this object entries should be:
   *    "pluginName" => \\{ pluginSpecificData \\}
   *
   * Note: This keyed data is only made available to publishers loaded
   * via the plugin matching the key value.
   *
   * When passed in via StratumService.publishTag, the data will be
   * available via the options.data argument in the getTagOutput()
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
   *      simpleEvent: SimpleTagModel
   *    }
   * })
   * ```
   *
   * Publish tag and optionally pass dynamic data to publishers
   * ```
   * stratum.publishTag(TagKey.MY_SIMPLE_TAG, {
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
   * // In SimpleTagModel
   * getTagOutput(tag: BaseTagModel, options?: Partial<TagOptions>) {
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
   * NOTE: Do not specify directly in options passed into StratumService.publishTag!
   *
   * This is a special derived field that is populated when sending data to publishers
   * sourced from the plugin name specified in `pluginData`
   */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  data: any;
}

/**
 * Derived as a subset of TagObjects, this defines the rules that
 * CAN be specified when passing options to StratumService.publishTag
 *
 * Specifically, we are excluding the `data` TagOptions property since
 * this is dynamically generated.
 */
export type UserDefinedTagOptions = Omit<TagOptions, 'data'>;

/**
 * Optional function that can be used to replace a dynamic placeholder
 * taking into account the TagObject context.
 */
export type TagOptionReplacementFn = (model: BaseTagModel) => string;

/**
 * Composite type that defines possible options of inputs
 * for the TagOptions.replacement property.
 */
export type TagOptionReplacement = string | TagOptionReplacementFn | boolean | number;

/**
 * Map of tag type (eventType) to associated TagModel class to
 * instantiate tags on validation.
 *
 * If a TagModel is loaded into the map from a Plugin, the pluginName
 * is specified.
 */
export interface TagTypeModelMap {
  [key: string]: {
    pluginName?: string;
    model: typeof BaseTagModel;
  };
}
