import { BasePlugin } from '../../base';
import type { PluginContext, PluginFactory } from '../../types';
import { NewRelicPublisher } from '../new-relic/publisher';
import { NewRelicEventType } from './constants';
import { NewRelicApiResponseEventModel, NewRelicErrorEventModel, NewRelicEventModel } from './model';
import type { NewRelicPluginOptions } from './types';

/**
 * New Relic+ plugin
 *
 * This plugin is an extension of the base New Relic plugin that
 * adds support for defining custom NR-only event types within your
 * Stratum catalog in addition to streaming interaction events to New Relic.
 *
 * This plugin adds 3 new event types:
 *   - General NR event
 *   - API response
 *   - Error event
 *
 * Use this plugin instead of NewRelicPlugin if you would like to publish
 * application-specific New Relic events. Otherwise, use the base plugin.
 */
export class NewRelicPlusPlugin extends BasePlugin<PluginContext, NewRelicPluginOptions> {
  name = 'newRelic'; // Same as NewRelicPlugin to prevent loading both plugins simultaneously
  eventTypes = {
    [NewRelicEventType.API_RESPONSE]: NewRelicApiResponseEventModel,
    [NewRelicEventType.ERROR]: NewRelicErrorEventModel,
    [NewRelicEventType.EVENT]: NewRelicEventModel
  };
  publishers = [new NewRelicPublisher()];
  context: PluginContext = {};
  options: NewRelicPluginOptions;
  globalContextPrefix = 'stratum';

  constructor(options?: NewRelicPluginOptions) {
    super();
    this.options = options ?? {};
    this.context = Object.assign({}, this.options.defaultContext ?? {});
  }
}

/**
 * New Relic+ plugin factory function
 *
 * Use this function to instantiate the NewRelicPlusPlugin when registering
 * this plugin within Stratum.
 */
export const NewRelicPlusPluginFactory: PluginFactory<NewRelicPlusPlugin> = (options) =>
  new NewRelicPlusPlugin(options);

export * from './constants';
export * from './model';
export * from './types';
