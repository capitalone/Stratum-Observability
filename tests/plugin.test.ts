import { StratumService } from '../src';
import type { StratumEvent } from '../src/types';
import { PRODUCT_NAME, PRODUCT_VERSION } from './utils/constants';
import { enableDebugMode, getPublishers, restoreStratumMocks } from './utils/helpers';
import {
  AModel,
  EmptyModel,
  PLUGIN_A_NAME,
  PLUGIN_B_NAME,
  PluginA,
  PluginAFactory,
  PluginB,
  PluginBFactory,
  PluginBOptions
} from './utils/sample-plugin';
import { SAMPLE_A_CATALOG } from './utils/catalog';

describe('stratum base plugin functionality', () => {
  let stratum: StratumService;
  let pluginA: PluginA;
  const pluginOptions: PluginBOptions = { versionNumber: 1, apiKey: 'abc123' };

  beforeEach(() => {
    enableDebugMode(true);
    pluginA = PluginAFactory();
    stratum = new StratumService({
      catalog: { tags: SAMPLE_A_CATALOG },
      productName: PRODUCT_NAME,
      productVersion: PRODUCT_VERSION,
      plugins: [pluginA]
    });
  });

  afterEach(() => {
    restoreStratumMocks();
    jest.restoreAllMocks();
  });

  describe('run time plugin registration', () => {
    it('should allow run time plugin registration and populate across the publishing flow', async () => {
      stratum.addPlugin(PluginBFactory({ pluginOptions }));
      const listener = jest.fn();
      const event = await new Promise<StratumEvent>((resolve) => {
        listener.mockImplementation((event) => resolve(event));
        stratum.addEventListener(listener);
        stratum.publishTag(1);
      });

      expect(Object.keys(stratum.injector.plugins)).toStrictEqual([PLUGIN_A_NAME, PLUGIN_B_NAME]);
      expect(Object.keys(stratum.injector.tagTypeModelMap).sort()).toStrictEqual(['a', 'b', 'base', 'empty']);
      expect(stratum.injector.tagTypeModelMap.empty.pluginName).toEqual(PLUGIN_A_NAME);
      expect(getPublishers(stratum)).toHaveLength(2);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(Object.keys(event.plugins)).toStrictEqual([PLUGIN_A_NAME]);
    });

    it('should allow plugin b publishers to intercept events from plugin a via acceptedTagModels', async () => {
      stratum.addPlugin(PluginBFactory({ pluginOptions, acceptedTagModels: [AModel] }));
      const listener = jest.fn();
      const event = await new Promise<StratumEvent>((resolve) => {
        listener.mockImplementation((event) => resolve(event));
        stratum.addEventListener(listener);
        stratum.publishTag(1);
      });
      expect(getPublishers(stratum)).toHaveLength(2);
      expect(Object.keys(event.plugins)).toStrictEqual([PLUGIN_A_NAME, PLUGIN_B_NAME]);
      expect(event.plugins[PLUGIN_B_NAME].options).toStrictEqual(pluginOptions);
    });
  });

  describe('plugin context', () => {
    it('should handle setting valid context vars', () => {
      expect(pluginA.getContext('var1')).toBe('default');
      const result = pluginA.setContext('var1', '123');
      expect(result).toBe(true);
      expect(pluginA.getContext('var1')).toBe('123');
    });

    it('should handle setting invalid context vars', () => {
      expect(pluginA.getContext('var3' as any)).toBeUndefined();
      const result = pluginA.setContext('var3' as any, '456');
      expect(result).toBe(false);
      expect(pluginA.getContext('var3' as any)).toBeUndefined();
    });
  });

  describe('plugin publishing', () => {
    it('should restrict publishing to plugin-specific models by default', () => {
      expect(pluginA.publishers[0].acceptedTagModels).toHaveLength(2);
      expect(pluginA.publishers[0].acceptedTagModels).toStrictEqual([EmptyModel, AModel]);
    });
  });

  describe('plugin lifecycle hooks', () => {
    it('should fire onRegister when plugin is loaded into the StratumService', () => {
      const onRegisterHookSpy = jest.spyOn(PluginB.prototype, 'onRegister');
      const pluginB = PluginBFactory({ pluginOptions });
      expect(onRegisterHookSpy).toHaveBeenCalledTimes(0);
      stratum.addPlugin(pluginB);
      expect(onRegisterHookSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('atomic publishing', () => {
    it('should preserve plugin vars at the time publishTag was called', async () => {
      const listener = jest.fn();

      const event = await new Promise<StratumEvent>((resolve) => {
        listener.mockImplementation((event) => resolve(event));
        stratum.addEventListener(listener);
        stratum.publishTag(1);
        pluginA.setContext('var1', '123');
      });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(event.plugins[PLUGIN_A_NAME].context.var1).toEqual('default');

      const event2 = await new Promise<StratumEvent>((resolve) => {
        listener.mockImplementation((event) => resolve(event));
        stratum.addEventListener(listener);
        stratum.publishTag(1);
      });
      expect(event2.plugins[PLUGIN_A_NAME].context.var1).toEqual('123');
    });
  });
});
