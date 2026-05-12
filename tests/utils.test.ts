import {
  addGlobalPlugin,
  addGlobalStratumSnapshotListener,
  addStratumSnapshotListener,
  debugModeEnabled,
  GLOBAL_LISTENER_KEY,
  generateCatalogId,
  generateDefaultSessionId,
  getGlobalPlugins,
  Injector,
  Logger,
  RegisteredStratumCatalog,
  removeGlobalPlugin,
  STORED_SESSION_ID_KEY,
  uuid
} from '../src';
import { INVALID_SAMPLE_CATALOG, SAMPLE_A_CATALOG, SAMPLE_A_CATALOG_2 } from './utils/catalog';
import { CATALOG_METADATA, globalWindow, PRODUCT_NAME, PRODUCT_VERSION, SESSION_ID } from './utils/constants';
import { enableDebugMode, isUuid, mockCrypto, restoreStratumMocks } from './utils/helpers';
import { PluginA, PluginAFactory, PluginB, SamplePublisher } from './utils/sample-plugin';

describe('util functions', () => {
  beforeEach(() => {
    mockCrypto();
  });

  afterEach(() => {
    restoreStratumMocks();
    jest.restoreAllMocks();
  });

  describe('catalog', () => {
    describe('generateCatalogId()', () => {
      it('should use the componentName and catalogVersion if provided', () => {
        const options = {
          items: {},
          catalogVersion: CATALOG_METADATA.catalogVersion,
          componentName: CATALOG_METADATA.componentName,
          componentVersion: CATALOG_METADATA.componentVersion
        };
        const expected = `${CATALOG_METADATA.componentName}:${CATALOG_METADATA.catalogVersion}`;
        expect(generateCatalogId(options, PRODUCT_NAME, PRODUCT_VERSION)).toEqual(expected);
      });

      it('should use the productName if componentName is not provided', () => {
        const options = {
          items: {},
          catalogVersion: CATALOG_METADATA.catalogVersion,
          componentVersion: CATALOG_METADATA.componentVersion
        };
        const expected = `${PRODUCT_NAME}:${CATALOG_METADATA.catalogVersion}`;
        expect(generateCatalogId(options, PRODUCT_NAME, PRODUCT_VERSION)).toEqual(expected);
      });

      it('should use the componentVersion if catalogVersion is not provided', () => {
        const options = {
          items: {},
          componentName: CATALOG_METADATA.componentName,
          componentVersion: CATALOG_METADATA.componentVersion
        };
        const expected = `${CATALOG_METADATA.componentName}:${CATALOG_METADATA.componentVersion}`;
        expect(generateCatalogId(options, PRODUCT_NAME, PRODUCT_VERSION)).toEqual(expected);
      });

      it('should use the productVersion if componentVersion is not provided', () => {
        const options = {
          items: {}
        };
        const expected = `${PRODUCT_NAME}:${PRODUCT_VERSION}`;
        expect(generateCatalogId(options, PRODUCT_NAME, PRODUCT_VERSION)).toEqual(expected);
      });
    });

    describe('RegisteredStratumCatalog', () => {
      const id = 'catalog-id';
      let injector: Injector;
      let publishFn: jest.Mock;
      const options = { items: SAMPLE_A_CATALOG, ...CATALOG_METADATA };

      beforeEach(() => {
        injector = new Injector(PRODUCT_NAME, PRODUCT_VERSION);
        injector.registerPlugin(PluginAFactory());
        publishFn = jest.fn();
      });

      it('should handle validating a stratum catalog on construction', () => {
        const catalog = new RegisteredStratumCatalog(id, options, injector, publishFn);
        expect(catalog.id).toEqual(id);
        expect(catalog.isValid).toBe(true);
      });

      it('should show validation errors for invalid events', () => {
        const options = { items: INVALID_SAMPLE_CATALOG, ...CATALOG_METADATA };
        // @ts-expect-error testing runtime handling with invalid types
        const catalog = new RegisteredStratumCatalog(id, options, injector, publishFn);

        expect(catalog.isValid).toBe(false);
        expect(Object.keys(catalog.validModels)).toHaveLength(1);
        expect(Object.keys(catalog.errors)).toHaveLength(4);
        expect(catalog.errors[0].errors).toHaveLength(1);
        expect(catalog.errors[1].errors).toHaveLength(1);
        expect(catalog.errors[3].errors).toHaveLength(1);
        expect(catalog.errors.duplicate.errors).toHaveLength(1);
      });

      it('should add new valid models via addItems at runtime', () => {
        const catalog = new RegisteredStratumCatalog(id, options, injector, publishFn);
        const initialCount = Object.keys(catalog.validModels).length;

        catalog.addItems(SAMPLE_A_CATALOG_2);
        expect(Object.keys(catalog.validModels)).toHaveLength(initialCount + 1);
        expect(catalog.validModels.abc).toBeDefined();
        expect(catalog.isValid).toBe(true);
      });

      it('should reject invalid items via addItems at runtime', () => {
        const catalog = new RegisteredStratumCatalog(id, options, injector, publishFn);
        const initialCount = Object.keys(catalog.validModels).length;
        expect(catalog.isValid).toBe(true);

        // @ts-expect-error testing runtime handling with invalid types
        catalog.addItems(INVALID_SAMPLE_CATALOG);

        expect(catalog.isValid).toBe(false);
        expect(Object.keys(catalog.validModels)).toHaveLength(initialCount);
        expect(Object.keys(catalog.errors)).toHaveLength(Object.keys(INVALID_SAMPLE_CATALOG).length);
      });

      it('should delegate publish to the provided publishFn', async () => {
        publishFn.mockResolvedValue(true);
        const catalog = new RegisteredStratumCatalog(id, options, injector, publishFn);
        const result = await catalog.publish(1);
        expect(result).toBe(true);
        expect(publishFn).toHaveBeenCalledWith(id, 1, undefined);
      });

      it('should add new valid models via addItems at runtime', () => {
        const catalog = new RegisteredStratumCatalog(id, options, injector, publishFn);
        const initialCount = Object.keys(catalog.validModels).length;

        catalog.addItems(SAMPLE_A_CATALOG_2);

        expect(Object.keys(catalog.validModels)).toHaveLength(initialCount + 1);
        expect(catalog.validModels.abc).toBeDefined();
        expect(catalog.isValid).toBe(true);
      });

      it('should reject invalid items via addItems at runtime', () => {
        const catalog = new RegisteredStratumCatalog(id, options, injector, publishFn);
        const initialCount = Object.keys(catalog.validModels).length;
        expect(catalog.isValid).toBe(true);

        // @ts-expect-error testing runtime handling with invalid types
        catalog.addItems(INVALID_SAMPLE_CATALOG);

        expect(catalog.isValid).toBe(false);
        expect(Object.keys(catalog.validModels)).toHaveLength(initialCount);
        expect(Object.keys(catalog.errors)).toHaveLength(Object.keys(INVALID_SAMPLE_CATALOG).length);
      });

      it('should recover isValid when failed keys are re-added successfully', () => {
        const invalidItems = { 1: INVALID_SAMPLE_CATALOG[1] };
        const options = { items: invalidItems, ...CATALOG_METADATA };
        // @ts-expect-error testing runtime handling with invalid types
        const catalog = new RegisteredStratumCatalog(id, options, injector, publishFn);

        expect(catalog.isValid).toBe(false);

        catalog.addItems(SAMPLE_A_CATALOG);

        expect(catalog.isValid).toBe(true);
        expect(Object.keys(catalog.errors)).toHaveLength(0);
      });

      it('should delegate publish to the provided publishFn', async () => {
        publishFn.mockResolvedValue(true);
        const catalog = new RegisteredStratumCatalog(id, options, injector, publishFn);
        const result = await catalog.publish(1);
        expect(result).toBe(true);
        expect(publishFn).toHaveBeenCalledWith(id, 1, undefined);
      });
    });
  });

  describe('env', () => {
    describe('stratum event listeners', () => {
      const configKey = `stratum_config_${PRODUCT_NAME}`;

      afterEach(() => {
        delete globalWindow[configKey];
        delete globalWindow[GLOBAL_LISTENER_KEY];
        jest.restoreAllMocks();
      });

      it('should add event listener to globalThis', () => {
        const mock = jest.fn();
        expect(addStratumSnapshotListener(PRODUCT_NAME, mock)).toBe(true);
        expect(globalWindow[configKey].listeners[0]).toStrictEqual(mock);
      });

      it('should read in all valid snapshot listeners', () => {
        const mockFn1 = jest.fn();
        const mockFn2 = jest.fn();

        const result1 = addStratumSnapshotListener(PRODUCT_NAME, mockFn1);
        const result2 = addStratumSnapshotListener(PRODUCT_NAME, mockFn2);
        expect(result1).toBe(true);
        expect(result2).toBe(true);
        expect(globalWindow[configKey].listeners).toStrictEqual([mockFn1, mockFn2]);
      });

      it('should add global snapshot listeners', () => {
        const mockFn1 = jest.fn();
        const mockFn2 = jest.fn();

        const result1 = addGlobalStratumSnapshotListener(mockFn1);
        const result2 = addGlobalStratumSnapshotListener(mockFn2);
        expect(result1).toBe(true);
        expect(result2).toBe(true);
        expect(globalWindow[GLOBAL_LISTENER_KEY].listeners).toStrictEqual([mockFn1, mockFn2]);
      });
    });

    describe('generateDefaultSessionId()', () => {
      it('should generate a valid UUID (non NIL) by default', () => {
        expect(isUuid(generateDefaultSessionId())).toBe(true);
      });

      it('should store the default session id in session storage', () => {
        expect(sessionStorage.getItem(STORED_SESSION_ID_KEY)).toBeNull();
        const id = generateDefaultSessionId();
        expect(sessionStorage.getItem(STORED_SESSION_ID_KEY)).toEqual(id);
      });

      it('should return the session id from session storage if available', () => {
        sessionStorage.setItem(STORED_SESSION_ID_KEY, SESSION_ID);
        expect(generateDefaultSessionId()).toEqual(SESSION_ID);
      });

      it('should return a random uuid if an error is encountered', () => {
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
          throw new Error();
        });
        expect(isUuid(generateDefaultSessionId())).toBe(true);
      });
    });

    describe('Logger', () => {
      it('should execute console.debug only if debugModeEnabled', () => {
        const logger = new Logger();
        const loggerSpy = jest.spyOn(console, 'debug').mockImplementation();
        const str = 'teststring';

        logger.debug(str);
        expect(loggerSpy).toHaveBeenCalledTimes(0);

        enableDebugMode(true);

        logger.debug(str);
        expect(loggerSpy).toHaveBeenCalledTimes(1);
        expect(loggerSpy).toHaveBeenCalledWith('[Stratum]', str);
      });
    });

    describe('debugModeEnabled()', () => {
      it('should return true if debug mode flag is found in session storage', () => {
        expect(debugModeEnabled()).toBe(false);
        enableDebugMode(true);
        expect(debugModeEnabled()).toBe(true);
      });

      it('should return false if session storage is unavailable', () => {
        jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
          throw new Error();
        });
        expect(debugModeEnabled()).toEqual(false);
      });
    });

    describe('uuid()', () => {
      it('should return a random UUID', () => {
        const uuid1 = uuid();
        const uuid2 = uuid();

        expect(isUuid(uuid1)).toBe(true);
        expect(isUuid(uuid2)).toBe(true);
        expect(uuid1 === uuid2).toBe(false);
      });

      it('should return the nil UUID if crypto library is unavailable', () => {
        delete globalWindow.crypto;
        expect(uuid()).toEqual('00000000-0000-0000-0000-000000000000');
      });
    });
  });

  describe('global-plugins', () => {
    it('should get global plugins', async () => {
      const plugin1 = new PluginA();
      const plugin2 = new PluginB({ versionNumber: 1, apiKey: 'api' }, new SamplePublisher('sample'));
      globalWindow[GLOBAL_LISTENER_KEY] = {
        globalPlugins: [plugin1, plugin2]
      };
      const globalPlugins = getGlobalPlugins();
      expect(globalPlugins).toEqual([plugin1, plugin2]);
    });

    it('should add a plugin to the global namespace', async () => {
      globalWindow[GLOBAL_LISTENER_KEY] = {};
      const plugin = new PluginA();
      addGlobalPlugin(plugin);
      expect(globalWindow[GLOBAL_LISTENER_KEY].globalPlugins).toEqual([plugin]);
    });

    it('should remove a plugin from the global namespace', async () => {
      const plugin1 = new PluginA();
      const plugin2 = new PluginB({ versionNumber: 1, apiKey: 'api' }, new SamplePublisher('sample'));
      globalWindow[GLOBAL_LISTENER_KEY] = {
        globalPlugins: [plugin1, plugin2]
      };
      removeGlobalPlugin('pluginA');
      expect(globalWindow[GLOBAL_LISTENER_KEY].globalPlugins).toEqual([plugin2]);
    });

    it('should not remove a plugin that does not exist', async () => {
      const plugin1 = new PluginA();
      const plugin2 = new PluginB({ versionNumber: 1, apiKey: 'api' }, new SamplePublisher('sample'));
      globalWindow[GLOBAL_LISTENER_KEY] = {
        globalPlugins: [plugin1, plugin2]
      };
      removeGlobalPlugin('pluginC');
      expect(globalWindow[GLOBAL_LISTENER_KEY].globalPlugins).toEqual([plugin1, plugin2]);
    });
  });
});
