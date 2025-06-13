import { BaseEventModel, BasePublisher } from '../../base';
import type { StratumSnapshot } from '../../types';
import { isDefined } from '../../utils/general';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
type NrSpaInteraction = any;

/**
 * Publisher for sending Stratum events to New Relic Browser SPA
 * 
 * This publisher converts Stratum catalog events into New Relic Browser Interactions,
 * enabling detailed tracking of user interactions and application events. It:
 * 
 * - Maps Stratum event data to New Relic Browser Interaction attributes
 * - Preserves global context and plugin-specific data
 * - Handles event naming and attribute management
 * - Manages interaction lifecycle (start/end/save)
 * 
 * The publisher requires the New Relic Browser SPA agent to be available
 * on the window object. It will only publish events when the agent is present.
 * 
 * @see https://docs.newrelic.com/docs/browser/new-relic-browser/browser-agent-spa-api/
 */
export class NewRelicPublisher extends BasePublisher {
  name = 'newRelic';

  /**
   * Map of hard-coded key-value pairs to handle differently
   * when encountered on publish.
   *
   * If the value is null, the publisher will skip
   * the associated key.
   */
  protected readonly modelKeyMap = {
    id: null,
    eventType: null,
    description: null
  };

  /**
   * Handle all event types generically, even those provided
   * by a separate plugin.
   */
  shouldPublishEvent(): boolean {
    return true;
  }

  /**
   * Determines if the publisher can send events to New Relic
   * 
   * Checks for the presence of the New Relic Browser SPA agent
   * on the window object. The publisher will only be available
   * when the agent is properly initialized.
   * 
   * @returns Promise resolving to true if the New Relic agent is available
   */
  async isAvailable(): Promise<boolean> {
    return !!this.publisher;
  }

  /**
   * Helper method to get the NewRelic object from the window.
   * This object should be added by the host application for consumption
   * by lower-level applications and MFEs.
   *
   * If the window does not exist, then return undefined.
   */
  protected get publisher() {
    if (typeof window !== 'undefined') {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      return (window as any).newrelic;
    }
    return undefined;
  }

  /**
   * Creates a new Browser Interaction with default attributes
   * 
   * Initializes a New Relic Browser Interaction with core Stratum metadata:
   * - Component information (name, version)
   * - Catalog details (id, version, event type)
   * - Product context (name, version)
   * - Session and event identifiers
   * - A/B test configurations
   * 
   * The interaction is configured with attributes that enable:
   * - Event correlation across systems
   * - Component-level tracking
   * - Session analysis
   * - A/B test impact measurement
   * 
   * @param snapshot The current Stratum event snapshot
   * @returns Configured New Relic Browser Interaction
   */
  protected getDefaultInteraction(snapshot: StratumSnapshot) {
    /**
     * End current interaction, if any exists.
     * This is so we don't accidentally overwrite an existing
     * interaction if New Relic has not ended it automatically
     *
     * See also: https://forum.newrelic.com/s/hubtopic/aAX8W0000008ZIqWAM/how-do-we-track-start-and-stop-in-browser-spa-interactions
     */
    this.publisher.interaction().end();

    const interaction = this.publisher
      .interaction()
      .setAttribute('componentName', snapshot.catalog.metadata.componentName)
      .setAttribute('componentVersion', snapshot.catalog.metadata.componentVersion)
      .setAttribute('catalogEventType', snapshot.event.eventType)
      .setAttribute('catalogId', snapshot.catalog.id)
      .setAttribute('catalogVersion', snapshot.catalog.metadata.catalogVersion)
      .setAttribute('stratumSessionId', snapshot.stratumSessionId)
      .setAttribute('productName', snapshot.productName)
      .setAttribute('productVersion', snapshot.productVersion)
      .setAttribute('stratumLibraryVersion', snapshot.stratumVersion)
      .setAttribute('stratumEventId', String(snapshot.event.id));

    if (snapshot.abTestSchemas.length) {
      interaction.setAttribute('abTests', snapshot.abTestSchemas);
    }

    this.setPluginContextData(interaction, snapshot);

    return interaction;
  }

  /**
   * Reach into all plugins and set the context data as attributes.
   *
   * This function will apply the context data for ALL registered plugins, regardless
   * of if the plugin is associated being published.
   *
   * NOTE: An edge case exists where two plugins with identical context keys collide.
   * In this case, only one attribute will be set on the NR event and the data is
   * ambiguous (most likely dependent on the order the plugins are registered).
   */
  protected setPluginContextData(interaction: NrSpaInteraction, snapshot: StratumSnapshot) {
    Object.values(snapshot.globalContext).forEach((context) => {
      (Object.keys(context) as (keyof typeof context)[]).forEach((k) => {
        const value = context[k];
        if (isDefined(value)) {
          interaction.setAttribute(k, context[k]);
        }
      });
    });
  }

  /**
   * Returns data from underlying events to utilize
   * in the publish step.
   */
  getEventOutput(_event: BaseEventModel, snapshot: StratumSnapshot) {
    return snapshot.data;
  }

  /**
   * Publishes event data to New Relic as a Browser Interaction
   * 
   * Converts Stratum event data into a New Relic Browser Interaction by:
   * 1. Creating a new interaction with default attributes
   * 2. Adding event-specific data as custom attributes
   * 3. Setting the interaction name if provided
   * 4. Saving and ending the interaction
   * 
   * The interaction is automatically ended to ensure proper
   * timing and prevent interaction overlap.
   * 
   * @param content Event data to publish
   * @param snapshot Current Stratum event snapshot
   */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  async publish(content: any, snapshot: StratumSnapshot) {
    const interaction = this.getDefaultInteraction(snapshot);
    const isValid = isDefined(snapshot?.eventOptions?.data?.isValid)
      ? !!snapshot?.eventOptions?.data?.isValid
      : undefined;
    interaction.setAttribute('isValid', isValid);

    /**
     * Attach any data that is returned by each event model's
     * getData() function
     */
    Object.keys(content).forEach((key) => {
      if (key in this.modelKeyMap || !isDefined(content[key])) {
        return;
      }
      if (key === 'name') {
        interaction.setName(content[key]);
      } else {
        interaction.setAttribute(key, content[key]);
      }
    });

    /**
     * Mark the interaction to save and manually
     * end it so that the save propagates.
     */
    interaction.save().end();
  }
}
