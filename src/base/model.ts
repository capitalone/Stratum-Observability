import type { CatalogEvent, CatalogKey, EventOptions } from '../types';
import { clone, performReplacements } from '../utils/event';
import { Injector } from '../utils/injector';

/**
 * Event models serve as a wrapper of an underlying CatalogEvent instance
 * interface to centralize shared logic between event types.
 * There should be a corresponding EventModel class extending from
 * BaseEventModel for each CatalogEvent eventType.
 */
export class BaseEventModel<T extends CatalogEvent = CatalogEvent> {
  /**
   * Stored value indicating the key used by the external
   * application to reference the cataloge item.
   */
  protected readonly key: CatalogKey;

  /**
   * Reference to the Injector class instantiated
   * by StratumService.
   */
  protected injector: Injector;

  /**
   * Flag indicating whether the underlying catalog item passes
   * validation rules. Populated in the constructor after
   * checkValidity is called.
   */
  private _isValid = false;

  /**
   * Underlying catalog item data that populates the event model. This
   * is received from the catalog on model load.
   */
  item: T;

  /**
   * ID of the catalog that owns this catalog item.
   */
  catalogId: string;

  /**
   * Any validation errors encountered while determining
   * the validity of the catalog item. Invalid catalog items
   * are not guaranteed to have associated errors as these
   * messages are used for debugging only.
   */
  validationErrors: string[] = [];

  /**
   * The underlying eventType of the catalog item that
   * was mapped to this model instance by a registered plugin.
   */
  eventType: string;

  /**
   * Checks validity of underlying catalog item data
   */
  constructor(key: CatalogKey, item: T, catalogId: string, injector: Injector) {
    this.key = key;
    this.item = clone(item);
    this.catalogId = catalogId;
    this.injector = injector;
    this.eventType = this.item.eventType;
    this._isValid = this.checkValidity();
  }

  /**
   * Getter function to return whether or not the catalog item
   * passes the event model validation checks.
   */
  get isValid() {
    return this._isValid;
  }

  /**
   * Getter function to return the id of the catalog item.
   */
  get id() {
    return this.item.id;
  }

  /**
   * Function that provides the logic to check if the underlying
   * catalog item contains valid data (run-time checking). This
   * validation is performed on class instantiation.
   *
   * This function should make use of/mirror the inheritance of the
   * underlying event types.
   */
  protected checkValidity(): boolean {
    if (!this.item || typeof this.item !== 'object') {
      this.addValidationError('Catalog item has an unexpected format');
      return false;
    }

    let isValid = true;

    if (
      (typeof this.id !== 'number' && typeof this.id !== 'string') ||
      (typeof this.id === 'number' && this.id < 0) ||
      (typeof this.id === 'string' && !this.id)
    ) {
      isValid = false;
      this.addValidationError('An invalid id was provided');
    }
    if (this.injector.isEventIdRegistered(this.catalogId, this.id)) {
      isValid = false;
      this.addValidationError(`Duplicate id "${this.id}" in catalog "${this.catalogId}"`);
    }
    if (typeof this.item.description !== 'string') {
      isValid = false;
      this.addValidationError('An invalid description was provided');
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
   * Function to return data from the EventModel to a publisher.
   * This function is the main way the data is exposed outside the model
   * to other parts of the service.
   *
   * The underlying catalog item data is cloned to avoid changing the data
   * when it's mapped by a publisher.
   */
  getData(options?: Partial<EventOptions>) {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const item = clone<any>(this.item);
    if (options?.replacements) {
      performReplacements(this, item, options.replacements);
    }
    return item;
  }
}
