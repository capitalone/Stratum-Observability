import type { AbTestSchema } from './ab-test';
import type { CatalogMetadata, EventId, EventOptions } from './catalog';
import type { PluginContext, PluginOptions } from './plugin';

/**
 * Snapshot view of all Stratum properties associated
 * with an event on publish.
 *
 * 1) Passed to any registered dynamic event listener
 *    functions
 * 2) Passed into publisher hooks to process data
 *    at time of initial publish call
 * 2) Used by dev tooling to debug Stratum data
 */
export interface StratumSnapshot {
  abTestSchemas: AbTestSchema[];
  catalog: {
    id: string;
    metadata: CatalogMetadata;
  };
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  data: any;

  /**
   * Snapshot of context data stored across all plugins, whether
   * associated with the specific eventType or not. This is used
   * by plugins that add global observability to the
   * all data stored by the library at a point-in-time.
   *
   * In most cases, you won't need  to use this. Rely on the data
   * associated to the associated plugin instead.
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
   * Plugin data for ONLY plugins associated with the
   * event (aka at least one publisher in the plugin passes
   * the `shouldPublishEvent` hook.)
   */
  plugins: {
    [pluginName: string]: StratumSnapshotPluginData;
  };

  stratumSessionId: string;
  stratumVersion: string;
  event: {
    eventType: string;
    id: EventId;
  };
  eventOptions?: Partial<EventOptions>;
}

/**
 * Plugin data saved and cloned within published StratumSnapshots
 */
export interface StratumSnapshotPluginData {
  context: PluginContext;
  options: PluginOptions;
}

/**
 * Callback functions that can be added as one-off event
 * listeners to Stratum for debugging purposes.
 *
 * Once registered within Stratum, these functions are executed
 * every time publish() is called on the service, passing along the
 * underlying Stratum snapshot data.
 */
export type StratumSnapshotListenerFn = (event: StratumSnapshot) => void;
