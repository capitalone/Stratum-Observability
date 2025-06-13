import { BasePublisher, StratumService } from '../../src';
import {
  BrowserConsolePlugin,
  BrowserConsolePluginFactory,
  BrowserConsolePublisher
} from '../../src/plugins/browser-console';
import { CATALOG_METADATA, PRODUCT_NAME, PRODUCT_VERSION } from '../utils/constants';
import { getPublishers, restoreStratumMocks } from '../utils/helpers';
import { BASE_CATALOG } from '../utils/catalog';
import { BaseEventModel } from '../../src/base/model';
import { StratumSnapshot } from '../../src/types';
import { Injector } from '../../src/utils/injector';

describe('browser console plugin', () => {
  let stratum: StratumService;
  let plugin: BrowserConsolePlugin;
  let publisher: BasePublisher;
  let mockEvent: BaseEventModel;
  let mockSnapshot: StratumSnapshot;
  let mockInjector: Injector;

  beforeEach(() => {
    plugin = BrowserConsolePluginFactory();
    stratum = new StratumService({
      catalog: { items: BASE_CATALOG, ...CATALOG_METADATA },
      plugins: [plugin],
      productName: PRODUCT_NAME,
      productVersion: PRODUCT_VERSION
    });
    publisher = stratum.publishers[0];
    mockInjector = new Injector(PRODUCT_NAME, PRODUCT_VERSION);
    mockEvent = new BaseEventModel('1', BASE_CATALOG[1], 'test-catalog', mockInjector);
    mockSnapshot = {
      event: { eventType: 'base', id: '1' },
      data: {},
      plugins: {},
      globalContext: {},
      catalog: { metadata: CATALOG_METADATA, id: 'test' },
      stratumSessionId: 'test-session',
      productName: PRODUCT_NAME,
      productVersion: PRODUCT_VERSION,
      stratumVersion: '1.0.0',
      abTestSchemas: []
    };
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
    expect(publisher).toBeInstanceOf(BrowserConsolePublisher);

    const publishSpy = jest.spyOn(publisher, 'publish');
    const consoleSpy = jest.spyOn(console, 'log');

    const result = await stratum.publish(1);
    const expectedSnapshot = {
      event: {
        eventType: BASE_CATALOG[1].eventType,
        id: BASE_CATALOG[1].id
      },
      data: {}, // Base events don't have data by default
      plugins: {
        browserConsole: {
          context: {},
          options: {}
        }
      },
      globalContext: {},
      catalog: {
        metadata: CATALOG_METADATA,
        id: expect.any(String)
      },
      stratumSessionId: expect.any(String),
      productName: PRODUCT_NAME,
      productVersion: PRODUCT_VERSION,
      stratumVersion: expect.any(String),
      abTestSchemas: []
    };

    expect(result).toBe(true);
    expect(publishSpy).toHaveBeenCalledWith(JSON.stringify(expectedSnapshot, null, 2), expect.anything());
    expect(consoleSpy).toHaveBeenCalledWith('BrowserConsolePlugin:', JSON.stringify(expectedSnapshot, null, 2));
  });

  it('should handle all event types', () => {
    expect(publisher.shouldPublishEvent(mockEvent)).toBe(true);
  });

  it('should check for console availability', async () => {
    const isAvailableSpy = jest.spyOn(publisher, 'isAvailable');
    await publisher.isAvailable(mockEvent, mockSnapshot);
    expect(isAvailableSpy).toHaveBeenCalled();
    expect(isAvailableSpy).toHaveReturnedWith(true);
  });

  it('should handle console unavailability', async () => {
    const originalConsole = global.console;
    // @ts-ignore - Intentionally removing console for test
    global.console = undefined;
    
    const isAvailable = await publisher.isAvailable(mockEvent, mockSnapshot);
    expect(isAvailable).toBe(false);
    
    // Restore console
    global.console = originalConsole;
  });
});
