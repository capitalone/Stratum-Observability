import { BasePublisher, StratumService } from '../../src';
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
  let publisher: BasePublisher;

  beforeEach(() => {
    plugin = BrowserConsolePluginFactory();
    stratum = new StratumService({
      catalog: { items: BASE_CATALOG, ...CATALOG_METADATA },
      plugins: [plugin],
      productName: PRODUCT_NAME,
      productVersion: PRODUCT_VERSION
    });
    publisher = stratum.publishers[0];
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
    expect(publisher).toBeInstanceOf(BrowserConsolePublisher);

    const publishSpy = jest.spyOn(publisher, 'publish');
    const consoleSpy = jest.spyOn(console, 'log');

    let result = await stratum.publish(1);

    expect(result).toBe(true);
    expect(publishSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(BASE_CATALOG[1]);

    result = await stratum.publish(2);

    expect(result).toBe(true);
    expect(publishSpy).toHaveBeenCalledTimes(2);
    expect(consoleSpy).toHaveBeenCalledWith(BASE_CATALOG[2]);

    expect(consoleSpy).toHaveBeenCalledTimes(2);
  });
});
