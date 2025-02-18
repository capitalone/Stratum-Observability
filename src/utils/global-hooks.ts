import { BaseEventModel } from '../base';
import { StratumSnapshot } from '../types';

type onBeforePublishHook = (content: any, model: BaseEventModel, snapshot: StratumSnapshot) => any;

export class GlobalHooks {
  /**
   * Returns the registered hooks for onBeforePublish
   */
  static get onBeforePublishHooks() {
    return window.stratum.globalHooks.onBeforePublishHooks;
  }

  /**
   * Initializes the GlobalHooks namsepaces
   */
  static #initNamespace() {
    // initialize stratum namespace if not exist
    if (!window.stratum) {
      window.stratum = {};
    } // if

    // initialize stratum globalPlugins if not exists
    if (!window.stratum.globalHooks) {
      window.stratum.globalHooks = {};
    } // if

    if (!window.stratum.globalHooks.onBeforePublishHooks) {
      window.stratum.globalHooks.onBeforePublishHooks = [];
    } // if
  }

  /**
   * Registers a hook function for onBeforePublish event
   * @param hook - function(content, model, snapshot) 
   */
  static registerOnBeforePublish(hook: onBeforePublishHook) {
    GlobalHooks.#initNamespace();

    window.stratum.globalHooks.onBeforePublishHooks.push(hook);
  }

  static triggerOnBeforePublish(content: any, model: BaseEventModel, snapshot: StratumSnapshot): any {
    if (GlobalHooks.onBeforePublishHooks?.length > 0) {
      // TODO: iterate through all hooks and transform content

    } // if
    
    return content;
  }
}
