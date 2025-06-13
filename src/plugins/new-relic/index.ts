import { BasePlugin } from '../../base';
import type { PluginFactory } from '../../types';
import { NewRelicPublisher } from './publisher';

/**
 * New Relic plugin for Stratum Observability
 *
 * This plugin integrates Stratum's event catalog with New Relic's Browser SPA monitoring.
 * It enables real-time tracking of user interactions and application events by:
 * - Converting Stratum catalog events into New Relic Browser Interactions
 * - Preserving event context and metadata across the integration
 * - Supporting custom attributes and event naming
 *
 * The plugin requires the New Relic Browser SPA agent to be initialized in your application.
 * Events are published as Browser Interactions.
 */
export class NewRelicPlugin extends BasePlugin<never, never> {
  name = 'newRelic';
  publishers = [new NewRelicPublisher()];
}

/**
 * Factory function for creating New Relic plugin instances
 *
 * Use this function when registering the New Relic plugin with Stratum.
 * The factory pattern ensures proper initialization and dependency injection.
 *
 * @returns A configured instance of the NewRelicPlugin
 */
export const NewRelicPluginFactory: PluginFactory<NewRelicPlugin> = () => new NewRelicPlugin();

export * from './publisher';
