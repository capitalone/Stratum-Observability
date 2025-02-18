import { BaseEventModel } from '../base';
import { StratumSnapshot } from '../types';

/**
 * OnBeforePublish hook function prototype
 */
type onBeforePublishHook = (content: any, model: BaseEventModel, snapshot: StratumSnapshot) => any;

/**
 * Static utitliy to handle global hooks functionality.
 */
export class GlobalHooks {
  /**
   * Returns the registered hooks for onBeforePublish
   */
  static get onBeforePublishHooks() {
    return window.stratum?.globalHooks?.onBeforePublish || [];
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

    if (!window.stratum.globalHooks.onBeforePublish) {
      window.stratum.globalHooks.onBeforePublish = [];
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

  /**
   * Trigger all onBeforePublish hooks
   * @param content - current content after mapping
   * @param model - Tag model
   * @param snapshot - Event snapshot
   * @returns - Returns the tag content
   */
  static triggerOnBeforePublishHooks(content: any, model: BaseEventModel, snapshot: StratumSnapshot): any {
    const hooks = GlobalHooks.onBeforePublishHooks;

    // no hooks
    if (hooks.length === 0) {
      return content;
    } // if

    // iterate through all hooks and transform content
    return hooks.reduce((contentAggregate: any, hook: onBeforePublishHook) => {
      let curConent;

      // try to apply hook
      try {
        curConent = hook(contentAggregate, model, snapshot);
      } catch (e) { } // try-catch
      
      return {
        ...contentAggregate,
        ...curConent
      };
    }, { ...content });
  }
}
