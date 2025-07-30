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
  let publisher: BrowserConsolePublisher;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    plugin = BrowserConsolePluginFactory();
    stratum = new StratumService({
      catalog: { items: BASE_CATALOG, ...CATALOG_METADATA },
      plugins: [plugin],
      productName: PRODUCT_NAME,
      productVersion: PRODUCT_VERSION
    });
    publisher = plugin.publishers[0];
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

  it('should publish and log events to the console', async () => {
    const publishSpy = jest.spyOn(publisher, 'publish');

    const expectedContent = JSON.stringify({
      eventType: BASE_CATALOG[1].eventType,
      id: BASE_CATALOG[1].id,
      key: '1'
    });
    const expectedLoggedMessage = `BrowserConsolePlugin: ${expectedContent}`;
    let result = await stratum.publish(1);

    expect(result).toBe(true);
    expect(publishSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(publishSpy).toHaveBeenCalledWith(expectedContent, expect.anything());
    expect(consoleSpy).toHaveBeenCalledWith(expectedLoggedMessage);

    publishSpy.mockClear();
    consoleSpy.mockClear();

    const expectedContent2 = JSON.stringify({
      eventType: BASE_CATALOG[2].eventType,
      id: '2',
      key: '2'
    });
    const expectedLoggedMessage2 = `BrowserConsolePlugin: ${expectedContent2}`;
    result = await stratum.publish(2);

    expect(result).toBe(true);
    expect(publishSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(publishSpy).toHaveBeenCalledWith(expectedContent2, expect.anything());
    expect(consoleSpy).toHaveBeenCalledWith(expectedLoggedMessage2);
  });
});
