import type { StratumSnapshot } from '../types';
import { Injector } from '../utils/injector';
import { BaseEventModel } from './model';

/**
 * Base publisher class. All publishers should extend this class
 * and implement their own specific functionality.
 *
 * The associated generic type should reference the mapped output of the
 * models `getModelOutput`.
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export abstract class BasePublisher<T = any> {
  /**
   * Human-readable name of the publisher class. Used by debug
   * and error messages.
   */
  abstract name: string;

  /**
   * This value is set by stratum once the publisher
   * is registered (immediately before initialize()).
   */
  pluginName!: string;

  /**
   * Optional array to define an accept-list of
   * event model classes to handle with this publisher.
   *
   * This array is a shortcut to hardcoding event types in the
   * isAvailable check for each publisher model.
   *
   * To accept all event types, do not override
   * this variable on child instances.
   */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  acceptedEventModels?: (typeof BaseEventModel<any>)[];

  /**
   * Placeholder hook to perform some actions once the publisher instance is
   * received and registered by a StratumService.
   */
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  onInitialize(_injector: Injector) {
    // Do nothing by default
  }

  /**
   * Function that returns true or false depending on whether
   * a given event type should be handled by the publisher. This allows
   * publishers to selectively filter event types based on contents.
   *
   * If this function does not return true, the publisher
   * will not attempt to process the event model on publish().
   *
   * Unless overridden, all models in acceptedEventModels will be handled
   * by the publisher.
   */
  shouldPublishEvent(event: BaseEventModel): boolean {
    if (Array.isArray(this.acceptedEventModels)) {
      return this.acceptedEventModels.some((model) => event instanceof model);
    }
    return true;
  }

  /**
   * Checks whether the publisher is available in the current
   * environment.
   *
   * If this function does not return true, the publisher
   * will not attempt to process the event model on publish().
   */
  abstract isAvailable(event: BaseEventModel, snapshot: StratumSnapshot): Promise<boolean>;

  /**
   * Function to map event model and options to the associated publisher
   * output format. All content-related logic should be added
   * as part of the method.
   */
  abstract getEventOutput(event: BaseEventModel, snapshot: StratumSnapshot): T;

  /**
   * Function that executes the publish action given the
   * the publisher-mapped event output.
   */
  abstract publish(content: T, snapshot: StratumSnapshot): Promise<void>;
}
