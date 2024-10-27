import { BasePlugin, BasePublisher, BaseEventModel } from '../../src';
import type { PluginFactory, PluginFactoryWithRequiredOptions, StratumSnapshot, CatalogEvent } from '../../src/types';

/**
 * Constants & types
 */

export const PLUGIN_A_NAME = 'pluginA';
export const PLUGIN_B_NAME = 'pluginB';

export enum SampleEventType {
  A = 'a',
  B = 'b'
}

export interface PluginAContext {
  var1: string;
  var2?: string;
}

export interface PluginAOptions {
  defaultContext: Partial<PluginAContext>;
}

export interface PluginBOptions {
  versionNumber: number;
  apiKey: string;
}

export interface PluginBFactoryOptions {
  pluginOptions: PluginBOptions;
  acceptedEventModels?: BasePublisher['acceptedEventModels'];
}

export interface AEvent extends CatalogEvent<SampleEventType.A> {
  prop1: string;
  prop2: string;
  name: string;
}

export interface BEvent extends CatalogEvent<SampleEventType.B> {
  prop3: boolean;
  prop4: number;
  prop5?: string;
}

/**
 * Models
 */

export class EmptyModel extends BaseEventModel {}
export class AModel extends BaseEventModel<AEvent> {}
export class BModel extends BaseEventModel<BEvent> {}

/**
 * Publishers
 */

export const samplePublisherSdk = jest.fn();

export class SamplePublisher extends BasePublisher {
  name: string;

  constructor(name: string, acceptedEventModels?: BasePublisher['acceptedEventModels']) {
    super();
    this.name = name;
    if (acceptedEventModels) {
      this.acceptedEventModels = acceptedEventModels;
    }
  }

  async isAvailable() {
    return true;
  }

  getEventOutput(_model: BaseEventModel) {
    return this.name;
  }

  async publish(content: any, event: StratumSnapshot) {
    samplePublisherSdk(event, content);
  }
}

/**
 * Plugin definitions
 */

export class PluginA extends BasePlugin<PluginAContext, PluginAOptions> {
  name = PLUGIN_A_NAME;
  publishers = [new SamplePublisher('publisher-a')];

  eventTypes = {
    empty: EmptyModel,
    [SampleEventType.A]: AModel
  };

  context = {
    var1: 'default',
    var2: undefined
  };

  constructor(options?: PluginAOptions) {
    super();
    if (options?.defaultContext) {
      Object.assign(this.context, options.defaultContext);
    }
  }
}

export class PluginB extends BasePlugin<never, PluginBOptions> {
  name = PLUGIN_B_NAME;

  eventTypes = {
    [SampleEventType.B]: BModel
  };

  constructor(options: PluginBOptions, publisher: SamplePublisher) {
    super();
    this.options = options;
    this.publishers = [publisher];
  }
}

export const PluginAFactory: PluginFactory<PluginA, PluginAOptions> = (options) => new PluginA(options);

export const PluginBFactory: PluginFactoryWithRequiredOptions<PluginB, PluginBFactoryOptions> = (
  options: PluginBFactoryOptions
) => new PluginB(options.pluginOptions, new SamplePublisher('publisher-b', options.acceptedEventModels));
