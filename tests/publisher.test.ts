import type { AbTest, StratumEvent } from '../src/types';
import { StratumService } from '../src';
import { AB_TEST_SCHEMA, PRODUCT_NAME, PRODUCT_VERSION } from './utils/constants';
import { enableAutoLogging, enableDebugMode, removeAllPublishers, restoreStratumMocks } from './utils/helpers';
import { SAMPLE_A_CATALOG } from './utils/catalog';
import { PLUGIN_A_NAME, PluginA, PluginAFactory } from './utils/sample-plugin';

describe('tag publishing', () => {
  let stratum: StratumService;
  let activeAbTest: AbTest;
  let PluginA: PluginA;

  beforeEach(() => {
    enableDebugMode(true);
    PluginA = PluginAFactory();
    stratum = new StratumService({
      catalog: { tags: SAMPLE_A_CATALOG },
      productName: PRODUCT_NAME,
      productVersion: PRODUCT_VERSION,
      plugins: PluginA
    });
    activeAbTest = stratum.startAbTest(AB_TEST_SCHEMA);
  });

  afterEach(() => {
    restoreStratumMocks();
    jest.restoreAllMocks();
  });

  describe('atomic publishing', () => {
    beforeEach(() => {
      removeAllPublishers(stratum);
    });

    it('should preserve product name set at the time publishTag is called', async () => {
      const listener = jest.fn();

      PluginA.setContext('var1', '123');
      PluginA.setContext('var2', 'Home');

      const event = await new Promise<StratumEvent>((resolve) => {
        listener.mockImplementation((event) => resolve(event));
        stratum.addEventListener(listener);
        stratum.publishTag(1);
        PluginA.setContext('var2', 'Next');
      });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(event.globalContext[PLUGIN_A_NAME][`${PLUGIN_A_NAME}_var2`]).toBe('Home');
      expect(PluginA.getContext('var2')).toBe('Next');
    });

    it('should preserve ab tests at the time publishTag was called', async () => {
      const listener = jest.fn();

      const event = await new Promise<StratumEvent>((resolve) => {
        listener.mockImplementation((event) => resolve(event));
        stratum.addEventListener(listener);
        stratum.publishTag(1);
        // Without waiting, end the active AB Test
        stratum.endAbTest(activeAbTest);
      });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(event.abTestSchemas.length).toBe(1);
      expect(stratum.abTests.length).toBe(0);
    });
  });

  describe('debug logging', () => {
    beforeEach(() => {
      removeAllPublishers(stratum);
    });

    it('should output stratum event to the console if debug mode is enabled', async () => {
      const mock = jest.spyOn(console, 'log').mockImplementation();

      stratum.publishTag(1);
      expect(mock).toHaveBeenCalledTimes(0);

      enableAutoLogging(true);
      const event = await new Promise<StratumEvent>((resolve) => {
        stratum.addEventListener((event) => resolve(event));
        stratum.publishTag(1);
      });

      expect(mock).toHaveBeenCalledTimes(1);
      expect(mock).toHaveBeenCalledWith('[Stratum]', 'publish', event);
    });
  });
});
