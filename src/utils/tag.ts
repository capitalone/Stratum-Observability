import { BasePublisherModel, BaseTagModel } from '../base';
import type {
  StratumEvent,
  TagOptionReplacement,
  TagOptionReplacementFn,
  TagOptions,
  UserDefinedTagOptions
} from '../types';
import { RegisteredTagCatalog } from './catalog';
import { Injector } from './injector';
import { isDefined, isObject, safeStringify } from './types';

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
 * Given an object, search through keys for dynamic placeholders $\\{...\\} and replace values
 * based on those found in the given replacement map.
 *
 * If the replacement of a given key is a function, replace the placeholder with the return
 * value of the function, given an instance of the underlying tag model.
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function performReplacements(model: BaseTagModel, obj: any, map: { [key: string]: TagOptionReplacement }): void {
  if (!isObject(obj)) {
    return;
  }
  Object.keys(obj).forEach((prop) => {
    if (typeof obj[prop] === 'string') {
      Object.keys(map).forEach((search) => {
        if (typeof map[search] === 'function') {
          obj[prop] = (<TagOptionReplacementFn>map[search])(model);
        } else {
          obj[prop] = obj[prop].replace(new RegExp('\\${' + search + '}', 'g'), map[search]);
        }
      });
    } else if (isObject(obj[prop])) {
      performReplacements(model, obj[prop], map);
    }
  });
}

/**
 * Helper method to generate a Stratum event given a tag model and a set
 * of tag options. Stratum events are sent to event listeners independently of
 * publisher logic.
 */
export function generateStratumEvent(
  injector: Injector,
  tag: BaseTagModel,
  catalog: RegisteredTagCatalog,
  publishers: BasePublisherModel[],
  options?: Partial<TagOptions>
): StratumEvent {
  const plugins: StratumEvent['plugins'] = {};
  publishers.forEach((publisher) => {
    if (publisher.pluginName && publisher.pluginName in injector.plugins) {
      const plugin = injector.plugins[publisher.pluginName];
      plugins[publisher.pluginName] = {
        context: plugin.context ?? {},
        options: plugin.options ?? {}
      };
    }
  });

  const globalContext: StratumEvent['globalContext'] = {};
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

  const clone = cloneStratumEvent({
    abTestSchemas: injector.abTestManager.generateContexts(options?.abTestSchemas),
    catalog: {
      metadata: catalog.metadata,
      id: catalog.id
    },
    stratumSessionId: injector.stratumSessionId,
    data: tag.getData(options),
    globalContext,
    plugins,
    productName: injector.productName,
    productVersion: injector.productVersion,
    stratumVersion: injector.version,
    tag: {
      displayName: tag.displayableName,
      eventType: tag.eventType,
      id: tag.tagId
    },
    tagOptions: options
  });

  return clone;
}

/**
 * Since StratumEvents contain nested objects that can be updated before
 * the event is read asynchronously, we deep-clone the event to create a
 * "snapshot" at the time of creation.
 */
export function cloneStratumEvent(event: StratumEvent): StratumEvent {
  return JSON.parse(safeStringify(event));
}

/**
 * Populate dynamic tag options based on the tag model and
 * publisher model.
 *
 * If publisher and tag belong to the same plugin, move any
 * plugin-specific data from incomingOptions into
 * `TagOptions.data`
 *
 * @param {BasePublisherModel} publisher - Publisher model to publish tag
 * @param {Partial<UserDefinedTagOptions>} incomingOptions - User-defined tag options provided to tag/publisher
 * @return {Partial<TagOptions>} Processed tag options
 */
export function populateDynamicTagOptions(
  publisher: BasePublisherModel,
  incomingOptions?: Partial<UserDefinedTagOptions>
): Partial<TagOptions> {
  const options: Partial<TagOptions> = Object.assign({}, incomingOptions ?? {});
  if (publisher.pluginName && isDefined(options.pluginData) && publisher.pluginName in options.pluginData) {
    options.data = options.pluginData[publisher.pluginName];
  }
  delete options.pluginData;
  return options;
}
