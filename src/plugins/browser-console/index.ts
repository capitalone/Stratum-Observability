import { BasePlugin } from '../../base';
import type { PluginFactory } from '../../types';
import { BrowserConsolePublisher } from './publisher';

/**
 * Browser Console plugin
 */
export class BrowserConsolePlugin extends BasePlugin<never, never> {
  name = 'browserConsole';
  publishers = [new BrowserConsolePublisher()];
}

/**
 * Browser Console plugin factory function
 *
 * Use this function to instantiate the BrowserConsolePlugin when registering
 * this plugin within Stratum.
 */
export const BrowserConsolePluginFactory: PluginFactory<BrowserConsolePlugin> = () => new BrowserConsolePlugin();

export * from './publisher';
