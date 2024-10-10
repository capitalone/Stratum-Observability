import { BaseTagModel } from '../base';
import type {
  TagCatalog,
  TagCatalogErrors,
  TagCatalogMetadata,
  TagKey,
  TagObject,
  UserDefinedTagCatalogOptions
} from '../types';
import { Injector } from './injector';

/**
 * Instance of a registered tag catalog. Takes in user defined
 * tag catalog items and metadata and performs validation to transform
 * tag objects into models.
 */
export class RegisteredTagCatalog<T extends TagObject = TagObject> {
  /**
   * Internal catalog id, generated from incoming options.
   */
  readonly id: string;

  /**
   * The (derived) tag catalog metadata provided by the service. The
   * metadata stored in this property has default values populated
   * if not provided by the user.
   */
  readonly metadata: TagCatalogMetadata;

  /**
   * Flag that indicates whether or not tag catalog passed
   * validation. Value is false if errors contains any entries, regardless
   * of validTags encountered.
   */
  isValid = true;

  /**
   * List of tag objects that failed validation in the
   * associated tag model. List is keyed by the
   * the object's catalog key.
   */
  readonly errors: TagCatalogErrors = {};

  /**
   * Map of tag keys loaded by the service to the corresponding
   * BaseTagModel instance. All models in this object are guaranteed
   * to have passed the respective model's validation. Any invalid tag
   * items are not included.
   *
   * This is list is referenced by the publishTag function when determining
   * if a given tag key can be published from the service.
   */
  readonly validTags: { [key in TagKey]: BaseTagModel<T> } = {};

  /**
   * Initializes the RegisteredTagCatalog class. On initialization, the following
   * processes occur:
   *  1. Set defaults for missing tag catalog metadata
   *  2. Perform tag validation on provided tags
   *
   * @param {string} id - Catalog id (generated by stratum)
   * @param {UserDefinedTagCatalogOptions<T>} options - Tag catalog tags and metadata provided by the user
   * @param {Injector} injector - Instance of the parent stratum service's injector
   */
  constructor(
    id: string,
    options: UserDefinedTagCatalogOptions<T>,
    private readonly injector: Injector
  ) {
    this.id = id;
    this.metadata = {
      catalogVersion: options.catalogVersion ?? '',
      componentName: options.componentName ?? injector.productName,
      componentVersion: options.componentVersion ?? injector.productVersion
    };

    // Perform catalog validation
    this.addTags(options.tags);

    if (!this.isValid) {
      const keys = Object.keys(this.errors);
      const ct = keys.length;
      injector.logger.debug(
        `${ct} invalid tag objects were removed when registering catalog "${this.id}": ${keys.join(', ')}`
      );
    }
  }

  /**
   * Validates and adds incoming tags to the tag catalog. Updates
   * catalog storage in place. Invalid tag objects are discarded and
   * associated tag keys are kept for reporting.
   *
   * Note: a case exists where the same tag key exists in both errors
   * and validTags if a tag key failed initially and was later re-added.
   *
   * @param {TagCatalog<T>} tags Incoming tags keyed by TagKey
   * @return {boolean} Flag indicating whether all tags passed validation or
   *   at least tag item failed validation
   */
  private addTags(tags: TagCatalog<T>): boolean {
    let isCatalogValid = true;
    for (const [key, tag] of Object.entries(tags)) {
      let displayableName = `Tag Key: "${key}"`;
      const errors = [];
      if (key in this.validTags) {
        errors.push('Duplicate tag key');
      } else {
        const model = this.getTagModel(key, tag);
        if (typeof model === 'string') {
          errors.push(model);
        } else {
          if (model.isValid) {
            this.validTags[key] = model;
            this.injector.registerTagId(this.id, model.tagId);
          } else {
            errors.push(...model.validationErrors);
            displayableName = model.displayableName;
          }
        }
      }
      if (errors.length) {
        isCatalogValid = false;
        if (key in this.errors) {
          this.errors[key].errors.push(...errors);
        } else {
          this.errors[key] = {
            displayableName,
            errors
          };
        }
      }
    }
    this.isValid = this.isValid && isCatalogValid;
    return isCatalogValid;
  }

  /**
   * Helper function to initialize a Tag Model given a tag object of
   * unknown type and validity.
   *
   * The particular model type to initialize is determined by the unknown tag's eventType property.
   * If this property cannot be resolved or the tag is unknown, the function immediately
   * returns a string error message.
   *
   * If the underlying tag object can populate a tag model, the instantiated model is returned.
   * The validity of the model is given by model.isValid.
   *
   * @param {TagKey} key - Key
   * @param {T} tag - Unknown tag object
   * @return {BaseTagModel<T> | string} Tag model instance or error message if a model for the
   *   cannot be found
   */
  private getTagModel(key: TagKey, tag: T): BaseTagModel<T> | string {
    const eventType = tag?.eventType;
    if (!eventType || !(eventType in this.injector.tagTypeModelMap)) {
      return `Event type "${eventType}" not found.`;
    }
    return new this.injector.tagTypeModelMap[eventType].model(key, tag, this.id, this.injector);
  }
}

/**
 * Generate a composite catalog id based on provided catalog metadata.
 *
 * The catalog id is a concatenated string of the catalog name and the catalog version.
 *
 * To determine catalog name:
 *   1. Use the component name
 *   2. OR use the product name if component name is not defined
 * To determine catalog version:
 *   1. Use the catalog version
 *   2. OR use the component version if the catalog version is not defined
 *   3. OR use the product version if the component version is not defined
 *
 * @param {UserDefinedTagCatalogOptions} options User defined tag catalog metadata
 * @param {string} productName Product name provided to the stratum service
 * @param {string} productVersion Product version provided to the stratum service
 * @return {string} Generated catalog id
 */
export function generateCatalogId(
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  options: UserDefinedTagCatalogOptions<any>,
  productName: string,
  productVersion: string
): string {
  const name = options.componentName || productName;
  const version = options.catalogVersion || options.componentVersion || productVersion;
  return `${name}:${version}`;
}
