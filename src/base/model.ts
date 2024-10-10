import type { TagKey, TagObject, TagOptions } from '../types';
import { Injector } from '../utils/injector';
import { clone, performReplacements } from '../utils/tag';

/**
 * Tag model classes serve as wrapper of the underlying TagObject
 * interface to centralize shared logic between tags. The type of
 * the underlying tag is dependent on the class. There should be a
 * corresponding TagModel class extending from BaseTagModel for
 * each TagObject interface.
 */
export class BaseTagModel<T extends TagObject = TagObject> {
  /**
   * Stored value indicating that key used by the external
   * application to reference the tag object.
   */
  protected readonly key: TagKey;

  /**
   * Underlying tag object data that populates the tag model. This
   * is received from the tag catalog on model load.
   */
  protected tag: T;

  /**
   * Reference to the Injector class instantiated
   * by StratumService.
   */
  protected injector: Injector;

  /**
   * Flag indicating whether underlying TagObject passes
   * validation rules. Populated in constructor after
   * checkValidity is called.
   */
  private _isValid = false;

  /**
   * ID of the catalog that owns this tag.
   */
  catalogId: string;

  /**
   * Any validation errors encountered while determining
   * the validity of the tag. Invalid tags are not guaranteed to
   * have associated errors since these messages are used for
   * debugging only.
   *
   * The isValid flag is still used to determine the tag's
   * validity.
   */
  validationErrors: string[] = [];

  /**
   * The underlying eventType of the tag object that
   * was mapped to this model instance.
   */
  eventType: string;

  /**
   * Check validity of underlying tag object data
   *
   * Although tag type is unknown, we can assume that the
   * TagObject is of the associated type corresponding to
   * the model class that is instantiated. This logic
   * is provided by StratumService.
   */
  constructor(key: TagKey, tag: T, catalogId: string, injector: Injector) {
    this.key = key;
    this.tag = clone(tag);
    this.catalogId = catalogId;
    this.injector = injector;
    this.eventType = this.tag.eventType;
    this._isValid = this.checkValidity();
  }

  /**
   * Get displayable name of the tag model based on the underlying tag content.
   * This value is typically used in debugging text and scripts within the service.
   */
  get displayableName() {
    return `Tag Key "${this.key}" (Type: "${this.eventType}"` + (this.tagId ? `, ID: "${this.tagId}"` : '') + ')';
  }

  /**
   * Getter function to return whether or not underlying TagObject
   * pass validation checks.
   */
  get isValid() {
    return this._isValid;
  }

  /**
   * Getter function to return the underlying tagId of
   * the tag.
   */
  get tagId() {
    return this.tag.tagId;
  }

  /**
   * Function that provides the logic to check if the underlying
   * TagObject contains valid data (run-time checking). This
   * validation is performed on class instantiation.
   *
   * This function should make use of/mirror the inheritance of the
   * underlying TagObject types. Check validation rules directly
   * associated with the TagObject type only. Rely on inheritance
   * to check parent logic.
   */
  protected checkValidity(): boolean {
    if (!this.tag || typeof this.tag !== 'object') {
      this.addValidationError('An unexpected format for the tag was encountered. Tag could not be processed.');
      return false;
    }

    let isValid = true;

    if (
      (typeof this.tag.tagId !== 'number' && typeof this.tag.tagId !== 'string') ||
      (typeof this.tag.tagId === 'number' && this.tag.tagId < 0) ||
      (typeof this.tag.tagId === 'string' && !this.tag.tagId)
    ) {
      isValid = false;
      this.addValidationError('An invalid tagId was provided');
    }
    if (this.injector.isTagIdRegistered(this.catalogId, this.tag.tagId)) {
      isValid = false;
      this.addValidationError(`Duplicate tagId "${this.tag.tagId}" in catalog "${this.catalogId}"`);
    }
    if (typeof this.tag.tagDescription !== 'string' || !this.tag.tagDescription) {
      isValid = false;
      this.addValidationError('Tag description must be provided');
    }

    return isValid;
  }

  /**
   * Helper function to record any validation errors encountered during
   * the execution of checkValidity
   */
  protected addValidationError(error: string) {
    this.validationErrors.push(error);
  }

  /**
   * Function to return data from the TagModel to a PublisherModel or
   * for additional debugging purposes. This function is the main way
   * the data is exposed outside the model to other parts of the service.
   *
   * The underlying TagObject data is cloned to avoid changing the data
   * when its mapped by the specific publisher.
   */
  getData(options?: Partial<TagOptions>) {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const tag = clone<any>(this.tag);
    if (options?.replacements) {
      performReplacements(this, tag, options.replacements);
    }
    return tag;
  }
}
