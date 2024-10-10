import type { AbTestSchema } from './ab-test';
import type { PluginContext, PluginOptions } from './plugin';
import type { TagCatalogMetadata, TagId, TagOptions } from './tag';

/**
 * Snapshot view of Stratum properties associated
 * with a tag on publish.
 *
 * 1) Passed to any registered dynamic event listener
 *    functions
 * 2) Passed into publisher hooks to process data
 *    at time of initial publish call
 * 2) Used by dev tooling to debug Stratum data
 */
export interface StratumEvent {
  abTestSchemas: AbTestSchema[];
  catalog: {
    id: string;
    metadata: TagCatalogMetadata;
  };
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  data: any;

  /**
   * Snapshot of context data stored across all plugins, whether
   * associated with the specific eventType or not. This is used
   * by plugins like New Relic that add observability to the
   * overall data stored.
   *
   * In most cases, do not use this. Rely on the purely-associated
   * plugin data instead.
   */
  globalContext: {
    [pluginName: string]: {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      [key: string]: any;
    };
  };

  productName: string;
  productVersion: string;

  /**
   * Plugin data ONLY for plugins associated with the
   * event (aka at least one publisher in the plugin passes
   * the `shouldPublishTag` hook.)
   */
  plugins: {
    [pluginName: string]: StratumEventPluginData;
  };

  stratumSessionId: string;
  stratumVersion: string;
  tag: {
    displayName: string;
    eventType: string;
    id: TagId;
  };
  tagOptions?: Partial<TagOptions>;
}

/**
 * Plugin data saved and cloned within published StratumEvents
 */
export interface StratumEventPluginData {
  context: PluginContext;
  options: PluginOptions;
}

/**
 * Callback functions that can be added to Stratum
 * to add one-off event listeners to Stratum, typically for
 * debugging purposes.
 *
 * Once registered within Stratum, these functions are executed
 * every time publishTag is called on the service, passing along the
 * underlying Stratum event data.
 */
export type StratumEventListenerFn = (event: StratumEvent) => void;
