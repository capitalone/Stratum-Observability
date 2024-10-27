import type { AbTest, StratumSnapshot } from '../src/types';
import { StratumService } from '../src';
import { AB_TEST_SCHEMA, PRODUCT_NAME, PRODUCT_VERSION } from './utils/constants';
import { enableDebugMode, removeAllPublishers, restoreStratumMocks } from './utils/helpers';
import { SAMPLE_A_CATALOG } from './utils/catalog';
import { PLUGIN_A_NAME, PluginA, PluginAFactory } from './utils/sample-plugin';

describe('event publishing', () => {
  let stratum: StratumService;
  let activeAbTest: AbTest;
  let PluginA: PluginA;

  beforeEach(() => {
    enableDebugMode(true);
    PluginA = PluginAFactory();
    stratum = new StratumService({
      catalog: { items: SAMPLE_A_CATALOG },
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

    it('should preserve product name set at the time publish is called', async () => {
      const listener = jest.fn();

      PluginA.setContext('var1', '123');
      PluginA.setContext('var2', 'Home');

      const event = await new Promise<StratumSnapshot>((resolve) => {
        listener.mockImplementation((event) => resolve(event));
        stratum.addSnapshotListener(listener);
        stratum.publish(1);
        PluginA.setContext('var2', 'Next');
      });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(event.globalContext[PLUGIN_A_NAME][`${PLUGIN_A_NAME}_var2`]).toBe('Home');
      expect(PluginA.getContext('var2')).toBe('Next');
    });

    it('should preserve ab tests at the time publish was called', async () => {
      const listener = jest.fn();

      const event = await new Promise<StratumSnapshot>((resolve) => {
        listener.mockImplementation((event) => resolve(event));
        stratum.addSnapshotListener(listener);
        stratum.publish(1);
        // Without waiting, end the active AB Test
        stratum.endAbTest(activeAbTest);
      });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(event.abTestSchemas.length).toBe(1);
      expect(stratum.abTests.length).toBe(0);
    });
  });
});
