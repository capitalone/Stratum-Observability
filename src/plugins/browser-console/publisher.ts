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
   */
  getEventOutput(_event: BaseEventModel, snapshot: StratumSnapshot) {
    return snapshot.data;
  }

  /**
   * Required
   * Check if your publisher source is available (aka scripts installed, environment
   * is set up, etc.)
   *
   * In this case, we make sure that console.log() is accessible.
   */
  async isAvailable() {
    return typeof console !== 'undefined';
  }

  /**
   * Required
   * Send your content to the external publisher
   *
   * In this, case we publish the snapshot data to the console log
   */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  async publish(_content: any, snapshot: StratumSnapshot) {
    console.log(snapshot.data);
  }
}
