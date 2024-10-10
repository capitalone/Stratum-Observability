import type { StratumEvent } from '../types';
import { Injector } from '../utils/injector';
import { BaseTagModel } from './model';

/**
 * Base publisher model class. All publisher models
 * should extend this class and implement
 * publisher-specific functionality.
 *
 * See StratumService.`publishTag` function for
 * an overview of how functions call order in the
 * publish lifecycle
 *
 * The associated generic type should reference
 * the specific mapped output of `getTagOutput`.
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export abstract class BasePublisherModel<T = any> {
  /**
   * String identifier that is used by StratumService to
   * manage the registered publishers within the service instance.
   *
   * This value is set via the service once the publisher
   * is initialized. If 0, the publisher instance
   * has not been initialized by the service.
   */
  id = 0;

  /**
   * This value is by stratum once the publisher
   * is registered (immediately before initialization).
   *
   * If the publisher was not registered via a plugin, this value
   * is undefined.
   */
  pluginName?: string;

  /**
   * Optional array to define an accept-list of accepted
   * tag model classes to handle with this publisher.
   *
   * This array is a shortcut to hardcoding tag names in the
   * isAvailable check for each publisher model.
   *
   * To accept all tag model instances, do not override
   * this variable on child instances.
   */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  acceptedTagModels?: (typeof BaseTagModel<any>)[];

  /**
   * Human-readable name of the publisher class. Used by debug
   * and error messages.
   */
  abstract name: string;

  /**
   * Initialize hook when the
   * publisher is first registered in the service.
   */
  readonly initialize = (id: number, injector: Injector) => {
    if (this.id) {
      return; // Already initialized
    }
    this.id = id;
    this.onInitialize(injector);
  };

  /**
   * Placeholder hook to perform some actions once the publisher instance is
   * received and processed by StratumService.
   */
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  protected onInitialize(_injector: Injector) {
    // Do nothing by default
  }

  /**
   * Function that returns true or false depending on whether
   * a given tag should be publishable. This allows publisher
   * models to selectively filter tags based on contents
   * to publish or ignore.
   *
   * If this function does not return true, the publisher model
   * will not attempt to publish the tag via `publish`.
   *
   * By default, all tags are acceptable to be published.
   */
  shouldPublishTag(tag: BaseTagModel): boolean {
    if (Array.isArray(this.acceptedTagModels)) {
      return this.acceptedTagModels.some((model) => tag instanceof model);
    }
    return true;
  }

  /**
   * Checks whether the publisher is available in the current
   * environment. Typically, publishers are made available
   * globally by a designated host.
   *
   * If this does not return true, the service will discard the
   * publisher on initialization and publishTag will never
   * be called.
   */
  abstract isAvailable(tag: BaseTagModel, event: StratumEvent): Promise<boolean>;

  /**
   * Function to map tag model and options to the associated publisher
   * output format. All tag content-related logic should be added
   * as part of the method.
   */
  abstract getTagOutput(tag: BaseTagModel, event: StratumEvent): T;

  /**
   * Function that executes the publish action given the
   * instance of a tag model along with any tag options
   * provided.
   *
   * This function is responsible for getting the mapped tag content (via
   * `getTagOutput`) and sending it to the specific publisher instance.
   *
   * We can assume that the by the time this function is called, the publisher
   * will always be available.
   */
  abstract publish(content: T, event: StratumEvent): Promise<void>;
}
