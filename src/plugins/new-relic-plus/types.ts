import type { CatalogEvent, PluginContext, PluginOptions } from '../../types';
import type { NewRelicEventType } from './constants';

/**
 * General New Relic event that can be used for general reporting, errors,
 * or logic gates.
 *
 * Specified by eventType `NewRelicEventType.EVENT`
 */
export interface NewRelicEvent<T extends string = NewRelicEventType.EVENT> extends CatalogEvent<T> {
  /**
   * Optional property that can be used to provide context of the
   * the application state on event publish.
   */
  context?: string;

  /**
   * Optional feature name to attach to New Relic event
   * to indicate what feature a user is interacting with
   */
  featureName?: string;

  /**
   * Optional general message to attach to New Relic event
   * containing data related to the event/output
   */
  message?: string;

  /**
   * Event name to identify the event that is being published
   */
  name: string;
}

/**
 * API response New Relic event that should be used when recording the success/failure of an API
 * request. We defer whether or not what responses should be deemed a "failure" vs. "success" to the
 * downstream New Relic query/alert/dashboard.
 *
 * Specified by eventType `NewRelicEventType.API_RESPONSE`
 */
export interface NewRelicApiResponseEvent extends NewRelicEvent<NewRelicEventType.API_RESPONSE> {
  /**
   * Stringified version of request headers that were sent along with the request.
   */
  requestHeaders?: string;

  /**
   * Uri of the request performed. This can be in any format
   * based on your reporting needs.
   */
  requestUri: string;

  /**
   * Status code returned from the API request
   */
  statusCode: string;

  /**
   * Any status text returned from the API
   * request
   */
  statusText?: string;

  /**
   * The retry number associated with the request made
   */
  retryNumber?: string;
}

/**
 * Generic error New Relic event that should be used when recording an error was encountered.
 * Specified by eventType `NewRelicEventType.ERROR`
 */
export interface NewRelicErrorEvent extends NewRelicEvent<NewRelicEventType.ERROR> {
  /**
   * Required error code string that is associated with the
   * error encountered
   */
  errorCode: string;

  /**
   * Any text associated with the error encountered
   */
  errorText?: string;

  /**
   * Optional user-friendly reason for the error showing up
   */
  reason?: string;

  /**
   * Optional flag indicating whether the error encountered displayed
   * a visual indicator or alert to the user.
   */
  isVisual?: boolean;
}

/**
 * Collection of all custom New Relic event objects for
 * convenience. Include this type within your StratumCatalog object in
 * TypeScript to allow TS compilation and IDE type-hinting.
 */
export type NewRelicEvents = NewRelicEvent | NewRelicApiResponseEvent | NewRelicErrorEvent;

/**
 * Plugin options for the New Relic+ plugin. These options should be
 * passed into the NewRelicPlusPluginFactory and provides the
 * default/configuration data for the plugin.
 */
export interface NewRelicPluginOptions extends PluginOptions {
  /**
   * Optional default values for one or more NewRelicContext
   * vars
   */
  defaultContext?: PluginContext;
}
