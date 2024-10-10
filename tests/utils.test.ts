import {
  RegisteredTagCatalog,
  generateCatalogId,
  Injector,
  Logger,
  STORED_SESSION_ID_KEY,
  GLOBAL_LISTENER_KEY,
  addGlobalStratumEventListener,
  addStratumEventListener,
  debugModeEnabled,
  generateDefaultSessionId,
  uuid,
  autoLoggingEnabled
} from '../src';
import { INVALID_SAMPLE_CATALOG, SAMPLE_A_CATALOG } from './utils/catalog';
import { CATALOG_METADATA, globalWindow, PRODUCT_NAME, PRODUCT_VERSION, SESSION_ID } from './utils/constants';
import { enableAutoLogging, enableDebugMode, isUuid, mockCrypto, restoreStratumMocks } from './utils/helpers';
import { PluginAFactory } from './utils/sample-plugin';

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
          tags: {},
          catalogVersion: CATALOG_METADATA.catalogVersion,
          componentName: CATALOG_METADATA.componentName,
          componentVersion: CATALOG_METADATA.componentVersion
        };
        const expected = `${CATALOG_METADATA.componentName}:${CATALOG_METADATA.catalogVersion}`;
        expect(generateCatalogId(options, PRODUCT_NAME, PRODUCT_VERSION)).toEqual(expected);
      });

      it('should use the productName if componentName is not provided', () => {
        const options = {
          tags: {},
          catalogVersion: CATALOG_METADATA.catalogVersion,
          componentVersion: CATALOG_METADATA.componentVersion
        };
        const expected = `${PRODUCT_NAME}:${CATALOG_METADATA.catalogVersion}`;
        expect(generateCatalogId(options, PRODUCT_NAME, PRODUCT_VERSION)).toEqual(expected);
      });

      it('should use the componentVersion if catalogVersion is not provided', () => {
        const options = {
          tags: {},
          componentName: CATALOG_METADATA.componentName,
          componentVersion: CATALOG_METADATA.componentVersion
        };
        const expected = `${CATALOG_METADATA.componentName}:${CATALOG_METADATA.componentVersion}`;
        expect(generateCatalogId(options, PRODUCT_NAME, PRODUCT_VERSION)).toEqual(expected);
      });

      it('should use the productVersion if componentVersion is not provided', () => {
        const options = {
          tags: {}
        };
        const expected = `${PRODUCT_NAME}:${PRODUCT_VERSION}`;
        expect(generateCatalogId(options, PRODUCT_NAME, PRODUCT_VERSION)).toEqual(expected);
      });
    });

    describe('RegisteredTagCatalog', () => {
      const id = 'catalog-id';
      let injector: Injector;

      beforeEach(() => {
        injector = new Injector(PRODUCT_NAME, PRODUCT_VERSION);
        injector.registerPlugin(PluginAFactory());
      });

      it('should handle validating a tag catalog on construction', () => {
        const options = { tags: SAMPLE_A_CATALOG, ...CATALOG_METADATA };
        const catalog = new RegisteredTagCatalog(id, options, injector);
        expect(catalog.id).toEqual(id);
        expect(catalog.isValid).toBe(true);
      });

      it('should show validation errors for invalid tags', () => {
        const options = { tags: INVALID_SAMPLE_CATALOG, ...CATALOG_METADATA };
        const catalog = new RegisteredTagCatalog(id, options, injector);
        expect(catalog.isValid).toBe(false);
        expect(Object.keys(catalog.validTags)).toHaveLength(1);
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

      it('should add event listener to global object', () => {
        const mock = jest.fn();
        expect(addStratumEventListener(PRODUCT_NAME, mock)).toBe(true);
        expect(globalWindow[configKey].listeners[0]).toStrictEqual(mock);
      });

      it('should read in all valid event listeners', () => {
        const mockFn1 = jest.fn();
        const mockFn2 = jest.fn();

        const result1 = addStratumEventListener(PRODUCT_NAME, mockFn1);
        const result2 = addStratumEventListener(PRODUCT_NAME, mockFn2);
        expect(result1).toBe(true);
        expect(result2).toBe(true);
        expect(globalWindow[configKey].listeners).toStrictEqual([mockFn1, mockFn2]);
      });

      it('should add global event listeners', () => {
        const mockFn1 = jest.fn();
        const mockFn2 = jest.fn();

        const result1 = addGlobalStratumEventListener(mockFn1);
        const result2 = addGlobalStratumEventListener(mockFn2);
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
      it('should execute console.autoLog only if debugModeEnabled', () => {
        const logger = new Logger();
        const loggerSpy = jest.spyOn(console, 'log').mockImplementation();
        const str = 'teststring';

        logger.autoLog(str);
        expect(loggerSpy).toHaveBeenCalledTimes(0);

        enableAutoLogging(true);

        logger.autoLog(str);
        expect(loggerSpy).toHaveBeenCalledTimes(1);
        expect(loggerSpy).toHaveBeenCalledWith('[Stratum]', str);
      });

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

    describe('autoLoggingEnabled()', () => {
      it('should return true if debug mode flag is found in session storage', () => {
        expect(autoLoggingEnabled()).toBe(false);
        enableAutoLogging(true);
        expect(autoLoggingEnabled()).toBe(true);
      });

      it('should return false if session storage is unavailable', () => {
        jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
          throw new Error();
        });
        expect(autoLoggingEnabled()).toEqual(false);
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
});
