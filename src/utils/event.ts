import { BasePublisher, BaseEventModel } from '../base';
import type {
  StratumSnapshot,
  EventReplacement,
  EventReplacementFn,
  EventOptions,
  UserDefinedEventOptions
} from '../types';
import { RegisteredStratumCatalog } from './catalog';
import { Injector } from './injector';
import { isDefined, isObject, safeStringify } from './general';

/**
 * Utility function to deep clone a given variable.
 * This function only handles simple and nested objects and arrays. Complex
 * types and functions may not be handled properly.
 */
export function clone<T>(source: T): T {
  return source && typeof source === 'object'
    ? Object.getOwnPropertyNames(source).reduce(
        (o, prop) => {
          Object.defineProperty(o, prop, Object.getOwnPropertyDescriptor(source, prop) as PropertyDescriptor);
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          o[prop] = clone((source as { [key: string]: any })[prop]);
          return o;
        },
        Object.create(Object.getPrototypeOf(source))
      )
    : source;
}

/**
 * Given an object, search through keys for dynamic placeholders {{ ... }} and replace values
 * based on those found in the given replacement map.
 *
 * If the replacement of a given key is a function, replace the placeholder with the return
 * value of the function, given an instance of the underlying event model.
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function performReplacements(model: BaseEventModel, obj: any, map: { [key: string]: EventReplacement }): void {
  if (!isObject(obj)) {
    return;
  }
  Object.keys(obj).forEach((prop) => {
    if (typeof obj[prop] === 'string') {
      Object.keys(map).forEach((search) => {
        if (typeof map[search] === 'function') {
          obj[prop] = (<EventReplacementFn>map[search])(model);
        } else {
          obj[prop] = obj[prop].replace(new RegExp('{{' + search + '}}', 'g'), map[search]);
        }
      });
    } else if (isObject(obj[prop])) {
      performReplacements(model, obj[prop], map);
    }
  });
}

/**
 * Helper method to generate a Stratum snapshot given an event model and a set
 * of event options. Stratum snapshot are sent to snapshot listeners independently of
 * plugin/publisher logic.
 */
export function generateStratumSnapshot(
  injector: Injector,
  model: BaseEventModel,
  catalog: RegisteredStratumCatalog,
  publishers: BasePublisher[],
  options?: Partial<EventOptions>
): StratumSnapshot {
  const plugins: StratumSnapshot['plugins'] = {};
  publishers.forEach((publisher) => {
    if (publisher.pluginName && publisher.pluginName in injector.plugins) {
      const plugin = injector.plugins[publisher.pluginName];
      plugins[publisher.pluginName] = {
        context: plugin.context ?? {},
        options: plugin.options ?? {}
      };
    }
  });

  const globalContext: StratumSnapshot['globalContext'] = {};
  Object.keys(injector.plugins).forEach((pluginName) => {
    const plugin = injector.plugins[pluginName];
    if (typeof plugin.context === 'object') {
      let context = plugin.context;
      if (plugin.useGlobalContextPrefix) {
        const prefix = plugin.globalContextPrefix ?? pluginName;
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        context = Object.keys(context).reduce((a, c) => ((a[`${prefix}_${c}`] = context[c]), a), {} as any);
      }
      globalContext[pluginName] = context;
    }
  });

  const clone = cloneStratumSnapshot({
    abTestSchemas: injector.abTestManager.generateContexts(options?.abTestSchemas),
    catalog: {
      metadata: catalog.metadata,
      id: catalog.id
    },
    stratumSessionId: injector.stratumSessionId,
    data: model.getData(options),
    globalContext,
    plugins,
    productName: injector.productName,
    productVersion: injector.productVersion,
    stratumVersion: injector.version,
    event: {
      eventType: model.eventType,
      id: model.id
    },
    eventOptions: options
  });

  return clone;
}

/**
 * Since StratumSnapshots contain nested objects that can be updated before
 * the event is processed asynchronously, we deep-clone the event to create a
 * "snapshot" at the time of creation.
 */
export function cloneStratumSnapshot(event: StratumSnapshot): StratumSnapshot {
  return JSON.parse(safeStringify(event));
}

/**
 * Populate dynamic event options based on the event model and
 * publisher.
 *
 * If publisher and event belong to the same plugin, move any
 * plugin-specific data from incomingOptions into
 * `EventOptions.data`
 *
 * @param {BasePublisher} publisher - Publisher instance to publish the specific event
 * @param {Partial<UserDefinedEventOptions>} incomingOptions - User-defined event options provided
 * @return {Partial<EventOptions>} Processed event options
 */
export function populateDynamicEventOptions(
  publisher: BasePublisher,
  incomingOptions?: Partial<UserDefinedEventOptions>
): Partial<EventOptions> {
  const options: Partial<EventOptions> = Object.assign({}, incomingOptions ?? {});
  if (publisher.pluginName && isDefined(options.pluginData) && publisher.pluginName in options.pluginData) {
    options.data = options.pluginData[publisher.pluginName];
  }
  delete options.pluginData;
  return options;
}
