import { BasePlugin, BasePublisherModel, BaseTagModel } from '../../src';
import type { PluginFactory, PluginFactoryWithRequiredOptions, StratumEvent, TagObject } from '../../src/types';

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
  acceptedTagModels?: BasePublisherModel['acceptedTagModels'];
}

export interface ATagObject extends TagObject<SampleEventType.A> {
  prop1: string;
  prop2: string;
  name: string;
}

export interface BTagObject extends TagObject<SampleEventType.B> {
  prop3: boolean;
  prop4: number;
  prop5?: string;
}

/**
 * Models
 */

export class EmptyModel extends BaseTagModel {}
export class AModel extends BaseTagModel<ATagObject> {}
export class BModel extends BaseTagModel<BTagObject> {}

/**
 * Publishers
 */

export const samplePublisherSdk = jest.fn();

export class SamplePublisher extends BasePublisherModel {
  name: string;

  constructor(name: string, acceptedTagModels?: BasePublisherModel['acceptedTagModels']) {
    super();
    this.name = name;
    if (acceptedTagModels) {
      this.acceptedTagModels = acceptedTagModels;
    }
  }

  async isAvailable() {
    return true;
  }

  getTagOutput(_tag: BaseTagModel) {
    return this.name;
  }

  async publish(content: any, event: StratumEvent) {
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
) => new PluginB(options.pluginOptions, new SamplePublisher('publisher-b', options.acceptedTagModels));
