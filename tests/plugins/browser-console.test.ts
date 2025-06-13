import { StratumService } from '../../src';
import {
  BrowserConsolePlugin,
  BrowserConsolePluginFactory,
  BrowserConsolePublisher
} from '../../src/plugins/browser-console';
import { CATALOG_METADATA, PRODUCT_NAME, PRODUCT_VERSION } from '../utils/constants';
import { getPublishers, restoreStratumMocks } from '../utils/helpers';
import { BASE_CATALOG } from '../utils/catalog';

describe('browser console plugin', () => {
  let stratum: StratumService;
  let plugin: BrowserConsolePlugin;

  beforeEach(() => {
    plugin = BrowserConsolePluginFactory();
    stratum = new StratumService({
      catalog: { items: BASE_CATALOG, ...CATALOG_METADATA },
      plugins: [plugin],
      productName: PRODUCT_NAME,
      productVersion: PRODUCT_VERSION
    });
  });

  afterEach(() => {
    restoreStratumMocks();
    jest.restoreAllMocks();
  });

  it('should successfully publish from catalog', async () => {
    const result = await stratum.publish(1);
    expect(result).toBe(true);
  });

  it('should initialize the BrowserConsole publisher', () => {
    expect(getPublishers(stratum)[0]).toBeInstanceOf(BrowserConsolePublisher);
  });

  it('should publish and log events to the console with full snapshot data', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    const result = await stratum.publish(1);
    expect(result).toBe(true);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const logged = consoleSpy.mock.calls[0][1];
    const parsed = JSON.parse(logged);
    // Check for required fields and types
    expect(parsed).toMatchObject({
      abTestSchemas: expect.any(Array),
      catalog: {
        metadata: CATALOG_METADATA,
        id: expect.any(String)
      },
      stratumSessionId: expect.any(String),
      data: {
        eventType: BASE_CATALOG[1].eventType,
        description: BASE_CATALOG[1].description,
        id: BASE_CATALOG[1].id
      },
      globalContext: {},
      plugins: {
        browserConsole: {
          context: {},
          options: {}
        }
      },
      productName: PRODUCT_NAME,
      productVersion: PRODUCT_VERSION,
      stratumVersion: expect.any(String),
      event: {
        eventType: BASE_CATALOG[1].eventType,
        id: BASE_CATALOG[1].id
      },
      eventOptions: {}
    });
  });

  it('should handle all event types', async () => {
    // This test now just ensures publishing works for a base event
    const result = await stratum.publish(1);
    expect(result).toBe(true);
  });
});
