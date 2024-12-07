import { BaseEventModel, BasePublisher } from '../../base';
import { StratumSnapshot } from '../../types';

/**
 * Browser Console Publisher
 */
export class BrowserConsolePublisher extends BasePublisher {
  name = 'browserConsole';

  /**
   * Handle all event types generically, even those provided
   * by a separate plugin.
   */
  shouldPublishEvent(): boolean {
    return true;
  }

  /**
   * Required
   * Returns data from underlying events to utilize
   * in the publish step.
   *
   * In this case, we send the stringified event data to be logged in the console.
   */
  getEventOutput(_event: BaseEventModel, snapshot: StratumSnapshot): string {
    return JSON.stringify(snapshot.event);
  }

  /**
   * Required
   * Check if your publisher source is available (aka scripts installed, environment
   * is set up, etc.)
   *
   * In this case, we make sure that console.log() is accessible.
   */
  async isAvailable(): Promise<boolean> {
    return typeof console !== 'undefined';
  }

  /**
   * Required
   * Send your content to the external publisher
   *
   * In this, case we publish the stringified event data to the console.
   */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  async publish(content: string): Promise<void> {
    console.log(`BrowserConsolePlugin: ${content}`);
  }
}
