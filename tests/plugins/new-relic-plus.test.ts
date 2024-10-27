import { BasePublisher, StratumService } from '../../src';
import {
  NewRelicApiResponseEventModel,
  NewRelicErrorEventModel,
  NewRelicEventModel,
  NewRelicPlusPlugin,
  NewRelicPlusPluginFactory
} from '../../src/plugins/new-relic-plus';
import { AB_TEST_SCHEMA, globalWindow, PRODUCT_NAME, PRODUCT_VERSION } from '../utils/constants';
import { NR_CATALOG, SAMPLE_A_CATALOG } from '../utils/catalog';
import { NR_MOCK } from '../utils/fixtures';
import { getPublishers, mockNewRelic, mockSessionId, restoreStratumMocks } from '../utils/helpers';
import { NewRelicPluginFactory, NewRelicPublisher } from '../../src/plugins/new-relic';
import { PluginAFactory } from '../utils/sample-plugin';

describe('NewRelicPlusPublisher', () => {
  let stratum: StratumService;
  let nrpPlugin: NewRelicPlusPlugin;

  beforeEach(() => {
    mockSessionId();
    nrpPlugin = NewRelicPlusPluginFactory();
    stratum = new StratumService({
      catalog: { items: NR_CATALOG },
      plugins: [nrpPlugin, NewRelicPluginFactory()],
      productName: PRODUCT_NAME,
      productVersion: PRODUCT_VERSION
    });
    stratum.startAbTest(AB_TEST_SCHEMA);
  });

  it('should not register both the NewRelic and NewRelicPlus plugin', () => {
    expect(Object.keys(stratum.injector.plugins)).toStrictEqual(['newRelic']);
  });

  it('should initialize the NewRelic publisher', () => {
    expect(getPublishers(stratum)[0]).toBeInstanceOf(NewRelicPublisher);
  });

  it('should set the acceptedEventModels of NewRelicPlusPublisher to NR-events only', () => {
    const nrpPublisher = getPublishers(stratum)[0];
    expect(nrpPublisher.acceptedEventModels).toEqual([
      NewRelicApiResponseEventModel,
      NewRelicErrorEventModel,
      NewRelicEventModel
    ]);
  });

  describe('custom event types', () => {
    describe('base event type', () => {
      it('should process a valid catalog item', () => {
        expect(stratum.defaultCatalog?.validModels.nrEventValid).toBeInstanceOf(NewRelicEventModel);
      });

      it('should process an invalid catalog item', () => {
        expect(stratum.defaultCatalog?.errors.nrEventInvalid).toBeDefined();
        expect(stratum.defaultCatalog?.errors.nrEventInvalid.errors).toHaveLength(1);
      });
    });

    describe('api response event type', () => {
      it('should process a valid catalog item', () => {
        expect(stratum.defaultCatalog?.validModels.nrApiValid).toBeInstanceOf(NewRelicApiResponseEventModel);
      });

      it('should process an invalid catalog item', () => {
        expect(stratum.defaultCatalog?.errors.nrApiInvalid).toBeDefined();
        expect(stratum.defaultCatalog?.errors.nrApiInvalid.errors).toHaveLength(2);
      });
    });

    describe('error event type', () => {
      it('should process a valid catalog item', () => {
        expect(stratum.defaultCatalog?.validModels.nrErrorValid).toBeInstanceOf(NewRelicErrorEventModel);
      });

      it('should process an invalid catalog item', () => {
        expect(stratum.defaultCatalog?.errors.nrErrorInvalid).toBeDefined();
        expect(stratum.defaultCatalog?.errors.nrErrorInvalid.errors).toHaveLength(2);
      });
    });
  });

  describe('publishing logic', () => {
    let publisher: BasePublisher;
    beforeEach(() => {
      publisher = stratum.publishers[0];
      mockNewRelic();
    });

    afterEach(() => {
      restoreStratumMocks();
      jest.restoreAllMocks();
    });

    it('should process the nrEvent event type', async () => {
      const publisherSpy = jest.spyOn(publisher, 'publish');
      const interactionSpy = jest.spyOn(globalWindow.newrelic, 'interaction');
      const saveSpy = jest.spyOn(globalWindow.newrelic, 'save');
      const setAttributeSpy = jest.spyOn(globalWindow.newrelic, 'setAttribute');
      const setNameSpy = jest.spyOn(globalWindow.newrelic, 'setName');
      const endSpy = jest.spyOn(globalWindow.newrelic, 'end');

      const result = await stratum.publish('nrEventValid');

      expect(result).toBe(true);
      expect(publisherSpy).toHaveBeenCalledTimes(1);
      expect(setAttributeSpy).toHaveBeenCalledTimes(Object.keys(NR_MOCK.event).length);
      expect(Object.fromEntries(setAttributeSpy.mock.calls)).toMatchObject(NR_MOCK.event);
      expect(setNameSpy).toHaveBeenCalledTimes(1);
      expect(setNameSpy).toHaveBeenCalledWith('nrevent');
      expect(saveSpy).toHaveBeenCalledTimes(1);
      expect(interactionSpy).toHaveBeenCalledTimes(2);
      expect(endSpy).toHaveBeenCalledTimes(2);
    });

    it('should process the nrApi event type', async () => {
      const publisherSpy = jest.spyOn(publisher, 'publish');
      const interactionSpy = jest.spyOn(globalWindow.newrelic, 'interaction');
      const saveSpy = jest.spyOn(globalWindow.newrelic, 'save');
      const setAttributeSpy = jest.spyOn(globalWindow.newrelic, 'setAttribute');
      const setNameSpy = jest.spyOn(globalWindow.newrelic, 'setName');
      const endSpy = jest.spyOn(globalWindow.newrelic, 'end');

      const result = await stratum.publish('nrApiValid');

      expect(result).toBe(true);
      expect(publisherSpy).toHaveBeenCalledTimes(1);

      expect(setAttributeSpy).toHaveBeenCalledTimes(Object.keys(NR_MOCK.api).length);
      expect(Object.fromEntries(setAttributeSpy.mock.calls)).toMatchObject(NR_MOCK.api);
      expect(setNameSpy).toHaveBeenCalledTimes(1);
      expect(setNameSpy).toHaveBeenCalledWith('nrapiresponse');
      expect(saveSpy).toHaveBeenCalledTimes(1);
      expect(interactionSpy).toHaveBeenCalledTimes(2);
      expect(endSpy).toHaveBeenCalledTimes(2);
    });

    it('should process the nrError event type', async () => {
      const publisherSpy = jest.spyOn(publisher, 'publish');
      const interactionSpy = jest.spyOn(globalWindow.newrelic, 'interaction');
      const saveSpy = jest.spyOn(globalWindow.newrelic, 'save');
      const setAttributeSpy = jest.spyOn(globalWindow.newrelic, 'setAttribute');
      const setNameSpy = jest.spyOn(globalWindow.newrelic, 'setName');
      const endSpy = jest.spyOn(globalWindow.newrelic, 'end');

      const result = await stratum.publish('nrErrorValid');

      expect(result).toBe(true);
      expect(publisherSpy).toHaveBeenCalledTimes(1);

      expect(setAttributeSpy).toHaveBeenCalledTimes(Object.keys(NR_MOCK.error).length);
      expect(Object.fromEntries(setAttributeSpy.mock.calls)).toMatchObject(NR_MOCK.error);
      expect(setNameSpy).toHaveBeenCalledTimes(1);
      expect(setNameSpy).toHaveBeenCalledWith('nrerror');
      expect(saveSpy).toHaveBeenCalledTimes(1);
      expect(interactionSpy).toHaveBeenCalledTimes(2);
      expect(endSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('custom context', () => {
    beforeEach(() => {
      mockNewRelic();
      nrpPlugin = NewRelicPlusPluginFactory({
        defaultContext: {
          myCustomVar: undefined,
          myCustomVar2: 'initial'
        }
      });
      stratum = new StratumService({
        catalog: { items: NR_CATALOG },
        plugins: [nrpPlugin],
        productName: PRODUCT_NAME,
        productVersion: PRODUCT_VERSION
      });
    });

    afterEach(() => {
      restoreStratumMocks();
      jest.restoreAllMocks();
    });

    it('should set the default context', () => {
      expect(stratum.injector.plugins.newRelic.context).toMatchObject({
        myCustomVar: undefined,
        myCustomVar2: 'initial'
      });
    });

    it('should only allow overriding default context keys', () => {
      const fail = nrpPlugin.setContext('abc', 1234);
      const success1 = nrpPlugin.setContext('myCustomVar', 1234);
      const success2 = nrpPlugin.setContext('myCustomVar2', 678);
      expect(fail).toBe(false);
      expect(success1).toBe(true);
      expect(success2).toBe(true);
      expect(stratum.injector.plugins.newRelic.context).toMatchObject({
        myCustomVar: 1234,
        myCustomVar2: 678
      });
    });

    it('should not publish undefined variables', async () => {
      const setAttributeSpy = jest.spyOn(globalWindow.newrelic, 'setAttribute');
      await stratum.publish('nrEventValid');
      const attributes = Object.fromEntries(setAttributeSpy.mock.calls);
      expect(Object.keys(attributes)).not.toContain('stratum_myCustomVar');
      expect(Object.keys(attributes)).toContain('stratum_myCustomVar2');
    });

    it('should pass prefixed context variables when publishing nr events', async () => {
      const setAttributeSpy = jest.spyOn(globalWindow.newrelic, 'setAttribute');
      nrpPlugin.setContext('myCustomVar', 'abc');
      nrpPlugin.setContext('myCustomVar2', false);
      await stratum.publish('nrEventValid');
      const attributes = Object.fromEntries(setAttributeSpy.mock.calls);
      expect(attributes.stratum_myCustomVar).toBe('abc');
      expect(attributes.stratum_myCustomVar2).toBe(false);
    });

    it('should include the default context when publishing other events', async () => {
      const setAttributeSpy = jest.spyOn(globalWindow.newrelic, 'setAttribute');
      stratum.addPlugin(PluginAFactory());
      nrpPlugin.setContext('myCustomVar', 'test1');
      nrpPlugin.setContext('myCustomVar2', 'test2');
      const id = stratum.addCatalog({ items: SAMPLE_A_CATALOG, componentName: 'noop' });
      await stratum.publishFromCatalog(id, 1);
      const attributes = Object.fromEntries(setAttributeSpy.mock.calls);
      expect(attributes.stratum_myCustomVar).toBe('test1');
      expect(attributes.stratum_myCustomVar2).toBe('test2');
    });
  });
});
