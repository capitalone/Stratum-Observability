import {
  STORED_SESSION_ID_KEY,
  addGlobalStratumSnapshotListener,
  RegisteredStratumCatalog,
  Logger,
  StratumService,
  addGlobalPlugin
} from '../src';
import * as utils from '../src/utils/general';
import { BrowserConsolePlugin, BrowserConsolePublisher } from '../src/plugins/browser-console';
import { enableDebugMode, getPublishers, mockCrypto, restoreStratumMocks } from './utils/helpers';
import {
  AB_TEST_SCHEMA,
  METADATA_CATALOG_ID,
  CATALOG_METADATA,
  PRODUCT_NAME,
  PRODUCT_VERSION,
  DEFAULT_CATALOG_ID,
  GENERATED_DEFAULT_METADATA,
  DEFAULT_CATALOG_ID_W_CATALOG_VERSION,
  globalWindow
} from './utils/constants';
import { SAMPLE_A_CATALOG, SAMPLE_A_CATALOG_2 } from './utils/catalog';
import { AModel, PluginAFactory, SamplePublisher } from './utils/sample-plugin';

describe('stratum service base functionality', () => {
  let stratum: StratumService;
  const catalog1Length = Object.keys(SAMPLE_A_CATALOG).length;

  beforeEach(() => {
    mockCrypto();
    stratum = new StratumService({
      catalog: { items: SAMPLE_A_CATALOG },
      productName: PRODUCT_NAME,
      productVersion: PRODUCT_VERSION,
      plugins: [PluginAFactory()]
    });
  });

  afterEach(() => {
    enableDebugMode(false);
    jest.restoreAllMocks();
    restoreStratumMocks();
  });

  it('should set the stratum service id', () => {
    expect(stratum.id).toEqual(`${PRODUCT_NAME}`);
  });

  it('should set the stratum library version', () => {
    expect(stratum.version).toEqual('__stratumLibraryVersion__');
  });

  it('should expect instance of stratum service with initial vars', () => {
    expect(stratum.injector.productName).toEqual(PRODUCT_NAME);
    expect(stratum.injector.productVersion).toEqual(PRODUCT_VERSION);
  });

  it('should expect a default service instance to be empty', () => {
    const stratum = new StratumService({
      productName: PRODUCT_NAME,
      productVersion: PRODUCT_VERSION
    });
    expect(getPublishers(stratum)).toEqual([]);
    expect(Object.keys(stratum.injector.eventTypeModelMap)).toHaveLength(1);
    expect(stratum.injector.eventTypeModelMap.base).toBeDefined();
    expect(Object.keys(stratum.catalogs)).toHaveLength(0);
    expect(stratum.defaultCatalog).toBeUndefined();
    expect(Object.keys(stratum.injector.plugins)).toHaveLength(0);
  });

  it('should create the expected models for a dynamically loaded StratumCatalog', () => {
    const stratum = new StratumService({
      productName: PRODUCT_NAME,
      productVersion: PRODUCT_VERSION,
      plugins: [PluginAFactory()]
    });
    const id = stratum.addCatalog({ items: SAMPLE_A_CATALOG, ...CATALOG_METADATA });
    const catalog = Object.values(stratum.catalogs)[0];
    expect(id).toEqual(METADATA_CATALOG_ID);
    expect(stratum.defaultCatalog).toBeUndefined();
    expect(catalog.isValid).toBe(true);
    expect(catalog.id).toBe(METADATA_CATALOG_ID);
    expect(catalog.metadata).toStrictEqual(CATALOG_METADATA);

    expect(Object.keys(catalog.errors)).toHaveLength(0);
    expect(Object.keys(catalog?.validModels)).toHaveLength(catalog1Length);

    expect(catalog.validModels[1]).toBeInstanceOf(AModel);
    expect(catalog.validModels[2]).toBeInstanceOf(AModel);
    expect(catalog.validModels[3]).toBeInstanceOf(AModel);
    expect(catalog.validModels[4]).toBeInstanceOf(AModel);

    expect(Object.keys(stratum.injector.registeredEventIds)).toHaveLength(1);
    const idObject = Object.entries(SAMPLE_A_CATALOG).reduce(
      (obj, [key, x]) => Object.assign(obj, { [x.id ?? key]: true }),
      {}
    );
    expect(stratum.injector.registeredEventIds[METADATA_CATALOG_ID]).toEqual(idObject);
  });

  it('should create the expected models for a default StratumCatalog', () => {
    const catalog = stratum.defaultCatalog as RegisteredStratumCatalog;
    expect(catalog).toBeDefined();
    expect(catalog.isValid).toBe(true);
    expect(catalog.id).toBe(DEFAULT_CATALOG_ID);
    expect(catalog.metadata).toStrictEqual(GENERATED_DEFAULT_METADATA);

    expect(Object.keys(catalog.errors)).toHaveLength(0);
    expect(Object.keys(catalog?.validModels)).toHaveLength(catalog1Length);

    expect(Object.keys(stratum.injector.registeredEventIds)).toHaveLength(1);
    const idObject = Object.entries(SAMPLE_A_CATALOG).reduce(
      (obj, [key, x]) => Object.assign(obj, { [x.id ?? key]: true }),
      {}
    );
    expect(stratum.injector.registeredEventIds[DEFAULT_CATALOG_ID]).toEqual(idObject);
  });

  it('should infer the properties of a default StratumCatalog without metadata', () => {
    stratum = new StratumService({
      catalog: { items: SAMPLE_A_CATALOG },
      productName: PRODUCT_NAME,
      productVersion: PRODUCT_VERSION,
      plugins: [PluginAFactory()]
    });

    const id = `${PRODUCT_NAME}:${PRODUCT_VERSION}`;
    const catalog = stratum.defaultCatalog as RegisteredStratumCatalog;
    expect(stratum.defaultCatalog).toBeDefined();
    expect(catalog.isValid).toBe(true);
    expect(catalog.id).toBe(id);
    expect(catalog.metadata).toStrictEqual({
      componentName: PRODUCT_NAME,
      componentVersion: PRODUCT_VERSION,
      catalogVersion: ''
    });
  });

  it('should allow partial definition of StratumCatalog metadata on initialization', () => {
    stratum = new StratumService({
      catalog: { items: SAMPLE_A_CATALOG },
      productName: PRODUCT_NAME,
      productVersion: PRODUCT_VERSION,
      plugins: [PluginAFactory()]
    });
    const id = `${PRODUCT_NAME}:${PRODUCT_VERSION}`;
    const catalog = stratum.defaultCatalog as RegisteredStratumCatalog;
    expect(stratum.defaultCatalog).toBeDefined();
    expect(catalog.isValid).toBe(true);
    expect(catalog.id).toEqual(id);
    expect(catalog.metadata).toStrictEqual({
      componentName: PRODUCT_NAME,
      componentVersion: PRODUCT_VERSION,
      catalogVersion: ''
    });
  });

  it('should register global plugins if available', () => {
    const consolePlugin = new BrowserConsolePlugin();
    addGlobalPlugin(consolePlugin);
    const localPlugins = PluginAFactory();
    stratum = new StratumService({
      catalog: { items: SAMPLE_A_CATALOG },
      productName: PRODUCT_NAME,
      productVersion: PRODUCT_VERSION,
      plugins: [localPlugins]
    });

    expect(stratum.publishers.length).toEqual(2);
    expect(stratum.publishers[0]).toBeInstanceOf(SamplePublisher);
    expect(stratum.publishers[1]).toBeInstanceOf(BrowserConsolePublisher);
  });

  it('should return catalog id even for duplicate catalogs', () => {
    // Add a standard catalog
    stratum.addCatalog({ items: SAMPLE_A_CATALOG, ...CATALOG_METADATA });
    expect(Object.keys(stratum.catalogs)).toHaveLength(2);

    // Attempt to add another catalog with the same metadata
    const id = stratum.addCatalog({ items: {}, ...CATALOG_METADATA });
    expect(id).toBe(METADATA_CATALOG_ID);
    expect(Object.keys(stratum.catalogs)).toHaveLength(2);

    // Update the metadata
    const result2 = stratum.addCatalog({
      items: {},
      ...CATALOG_METADATA,
      catalogVersion: 'different'
    });
    expect(result2).toBeDefined();
    expect(Object.keys(stratum.catalogs)).toHaveLength(3);
  });

  it('should handle removing catalogs at run-time', () => {
    stratum = new StratumService({
      catalog: { items: SAMPLE_A_CATALOG, catalogVersion: CATALOG_METADATA.catalogVersion },
      productName: PRODUCT_NAME,
      productVersion: PRODUCT_VERSION,
      plugins: [PluginAFactory()]
    });

    const id = stratum.addCatalog({ items: SAMPLE_A_CATALOG_2, ...CATALOG_METADATA }) as string;
    const defaultId = stratum.defaultCatalog?.id as string;

    expect(id).toBe(METADATA_CATALOG_ID);
    expect(defaultId).toBe(DEFAULT_CATALOG_ID_W_CATALOG_VERSION);
    expect(Object.keys(stratum.catalogs)).toHaveLength(2);
    expect(stratum.defaultCatalog).toBeDefined();
    expect(Object.keys(stratum.injector.registeredEventIds)).toHaveLength(2);
    expect(stratum.injector.registeredEventIds[defaultId]).toBeDefined();
    expect(stratum.injector.registeredEventIds[id]).toBeDefined();

    stratum.removeCatalog(defaultId);

    expect(Object.keys(stratum.catalogs)).toHaveLength(1);
    expect(Object.keys(stratum.injector.registeredEventIds)).toHaveLength(1);
    expect(stratum.defaultCatalog).toBeUndefined();
    expect(stratum.injector.registeredEventIds[defaultId]).toBeUndefined();

    stratum.removeCatalog(id);

    expect(Object.keys(stratum.catalogs)).toHaveLength(0);
    expect(Object.keys(stratum.injector.registeredEventIds)).toHaveLength(0);
  });

  describe('publish unhappy paths', () => {
    it('should fail to publish an event if a default catalog is not found', async () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'debug');
      stratum = new StratumService({ productName: PRODUCT_NAME, productVersion: PRODUCT_VERSION });
      const result = await stratum.publish('foo');
      expect(result).toBe(false);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('should warn if catalog to publish from cannot be found', async () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'debug');
      const result = await stratum.publishFromCatalog('unknowncatalogid', 1);
      expect(result).toBe(false);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('should warn if the key to publish in catalog cannot be found', async () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'debug');
      const result = await stratum.publishFromCatalog(DEFAULT_CATALOG_ID, 'unknownkey');
      expect(result).toBe(false);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('ab test manager', () => {
    it('should return started ab tests', () => {
      expect(stratum.abTests).toEqual([]);
      stratum.startAbTest(AB_TEST_SCHEMA);
      expect(stratum.abTests).toHaveLength(1);
      expect(stratum.abTests[0].data).toEqual(AB_TEST_SCHEMA);
    });

    it('should remove ab test from manager after end', () => {
      stratum.startAbTest(AB_TEST_SCHEMA);
      expect(stratum.abTests).toHaveLength(1);
      expect(stratum.abTests[0].data).toEqual(AB_TEST_SCHEMA);

      stratum.endAbTest({ id: stratum.abTests[0].id, data: AB_TEST_SCHEMA });
      expect(stratum.abTests).toEqual([]);
    });

    it('should remove all ab tets from manager', () => {
      stratum.startAbTest(AB_TEST_SCHEMA);
      stratum.startAbTest(AB_TEST_SCHEMA);
      expect(stratum.abTests).toHaveLength(2);
      stratum.endAllAbTests();
      expect(stratum.abTests).toEqual([]);
    });
  });

  describe('stratum session id', () => {
    it('should generate a valid UUID (non NIL) by default', () => {
      const regExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(regExp.test(stratum.stratumSessionId)).toBe(true);
    });

    it('should store the default stratum id in session storage', () => {
      let id = stratum.stratumSessionId;
      expect(sessionStorage.getItem(STORED_SESSION_ID_KEY)).toEqual(id);
    });

    it('should set the default id from session storage if available', () => {
      sessionStorage.setItem(STORED_SESSION_ID_KEY, 'test-id');
      stratum = new StratumService({
        productName: PRODUCT_NAME,
        productVersion: PRODUCT_VERSION
      });
      expect(stratum.stratumSessionId).toEqual('test-id');
    });
  });

  describe(`globalThis events`, () => {
    it('should not attempt to load event listeners if debug mode is not enabled', () => {
      expect(stratum.injector.getExternalSnapshotListeners()).toEqual([]);
    });

    it('should fail to add event listener if an error occurs', () => {
      jest.spyOn(utils, 'isDefined').mockImplementation(() => {
        throw new Error();
      });
      expect(stratum.addSnapshotListener(() => {})).toBe(false);
    });

    it('should add event listener to the global object', () => {
      const mock = jest.fn();
      expect(stratum.addSnapshotListener(mock)).toBe(true);
      expect(globalWindow[`stratum_config_${PRODUCT_NAME}`].listeners[0]).toStrictEqual(mock);
    });

    it('should read in all valid event listeners', () => {
      const mockFn1 = jest.fn();
      const mockFn2 = jest.fn();

      enableDebugMode(true);
      stratum.addSnapshotListener(mockFn1);
      addGlobalStratumSnapshotListener(mockFn2);

      expect(stratum.injector.getExternalSnapshotListeners()).toStrictEqual([mockFn2, mockFn1]);
    });
  });
});
