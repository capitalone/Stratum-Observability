import {
  RegisteredStratumCatalog,
  generateCatalogId,
  Injector,
  Logger,
  STORED_SESSION_ID_KEY,
  GLOBAL_LISTENER_KEY,
  addGlobalStratumSnapshotListener,
  addStratumSnapshotListener,
  debugModeEnabled,
  generateDefaultSessionId,
  uuid,
  getGlobalPlugins,
  addGlobalPlugin,
  removeGlobalPlugin
} from '../src';
import { INVALID_SAMPLE_CATALOG, SAMPLE_A_CATALOG } from './utils/catalog';
import { CATALOG_METADATA, globalWindow, PRODUCT_NAME, PRODUCT_VERSION, SESSION_ID } from './utils/constants';
import { enableDebugMode, isUuid, mockCrypto, restoreStratumMocks } from './utils/helpers';
import { PluginAFactory, PluginA, PluginB, SamplePublisher } from './utils/sample-plugin';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const g = globalThis as any;

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

      beforeEach(() => {
        injector = new Injector(PRODUCT_NAME, PRODUCT_VERSION);
        injector.registerPlugin(PluginAFactory());
      });

      it('should handle validating a stratum catalog on construction', () => {
        const options = { items: SAMPLE_A_CATALOG, ...CATALOG_METADATA };
        const catalog = new RegisteredStratumCatalog(id, options, injector);
        expect(catalog.id).toEqual(id);
        expect(catalog.isValid).toBe(true);
      });

      it('should show validation errors for invalid events', () => {
        const options = { items: INVALID_SAMPLE_CATALOG, ...CATALOG_METADATA };
        const catalog = new RegisteredStratumCatalog(id, options, injector);
        expect(catalog.isValid).toBe(false);
        expect(Object.keys(catalog.validModels)).toHaveLength(1);
        expect(Object.keys(catalog.errors)).toHaveLength(4);
        expect(catalog.errors[0].errors).toHaveLength(1);
        expect(catalog.errors[1].errors).toHaveLength(2);
        expect(catalog.errors[3].errors).toHaveLength(1);
        expect(catalog.errors['duplicate'].errors).toHaveLength(1);
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
        delete (globalThis as any).crypto;
        expect(uuid()).toEqual('00000000-0000-0000-0000-000000000000');
      });
    });
  });

  describe('global-plugins', () => {
    it('should get global plugins', async () => {
      // Arrange.
      const plugin1 = new PluginA();
      const plugin2 = new PluginB({ versionNumber: 1, apiKey: 'api' }, new SamplePublisher('sample'));
      g[GLOBAL_LISTENER_KEY] = {
        globalPlugins: [plugin1, plugin2]
      };

      // Act.
      const globalPlugins = getGlobalPlugins();

      // Assert.
      expect(globalPlugins).toEqual([plugin1, plugin2]);
    });

    it('should add a plugin to the global namespace', async () => {
      // Arrange.
      g[GLOBAL_LISTENER_KEY] = {};

      // Act.
      const plugin = new PluginA();
      addGlobalPlugin(plugin);

      // Assert.
      expect(g[GLOBAL_LISTENER_KEY].globalPlugins).toEqual([plugin]);
    });

    it('should remove a plugin from the global namespace', async () => {
      // Arrange.
      const plugin1 = new PluginA();
      const plugin2 = new PluginB({ versionNumber: 1, apiKey: 'api' }, new SamplePublisher('sample'));
      g[GLOBAL_LISTENER_KEY] = {
        globalPlugins: [plugin1, plugin2]
      };
      // Act.
      removeGlobalPlugin('pluginA');

      // Assert.
      expect(g[GLOBAL_LISTENER_KEY].globalPlugins).toEqual([plugin2]);
    });

    it('should not remove a plugin that does not exist', async () => {
      // Arrange.
      const plugin1 = new PluginA();
      const plugin2 = new PluginB({ versionNumber: 1, apiKey: 'api' }, new SamplePublisher('sample'));
      g[GLOBAL_LISTENER_KEY] = {
        globalPlugins: [plugin1, plugin2]
      };

      // Act.
      removeGlobalPlugin('pluginC');

      // Assert.
      expect(g[GLOBAL_LISTENER_KEY].globalPlugins).toEqual([plugin1, plugin2]);
    });
  });
});
