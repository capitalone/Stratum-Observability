import { BaseEventModel, BasePublisher } from '../../base';
import { StratumSnapshot } from '../../types';

/**
 * Browser Console Publisher
 *
 * This publisher logs all Stratum events to the browser console with detailed
 * information about the event, including event data, plugin context, global context,
 * catalog metadata, and session information.
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
   * Returns the full snapshot data to be logged in the console.
   * This includes:
   * - Event type and ID
   * - Event data
   * - Plugin context
   * - Global context
   * - Catalog metadata
   * - Session information
   */
  getEventOutput(_event: BaseEventModel, snapshot: StratumSnapshot): string {
    return JSON.stringify(snapshot, null, 2);
  }

  /**
   * Check if the browser console is available for logging.
   */
  async isAvailable(): Promise<boolean> {
    return typeof console !== 'undefined';
  }

  /**
   * Log the event data to the browser console.
   * The output is prefixed with the plugin name for easy identification.
   */
  async publish(content: string): Promise<void> {
    console.log('BrowserConsolePlugin:', content);
  }
}
