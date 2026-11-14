import { NewRelicPluginFactory, NewRelicPublisher } from '@plugins/new-relic';
import {
  NewRelicApiResponseEventModel,
  NewRelicErrorEventModel,
  NewRelicEventModel,
  type NewRelicPlusPlugin,
  NewRelicPlusPluginFactory
} from '@plugins/new-relic-plus';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type BasePublisher, StratumService } from '@';
import {
  AB_TEST_SCHEMA,
  getPublishers,
  mockNewRelic,
  mockSessionId,
  NR_CATALOG,
  NR_MOCK,
  PLACEHOLDERS,
  PluginAFactory,
  PRODUCT_NAME,
  PRODUCT_VERSION,
  SAMPLE_A_CATALOG,
  SAMPLE_EVENT_OPTIONS
} from '../utils';

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
    let nrMock: ReturnType<typeof mockNewRelic>;
    beforeEach(() => {
      publisher = stratum.publishers[0];
      nrMock = mockNewRelic();
    });

    it('should process the nrEvent event type', async () => {
      const publisherSpy = vi.spyOn(publisher, 'publish');
      const result = await stratum.publish('nrEventValid');

      expect(result).toBe(true);
      expect(publisherSpy).toHaveBeenCalledTimes(1);
      expect(nrMock.setAttribute).toHaveBeenCalledTimes(Object.keys(NR_MOCK.event).length);
      expect(Object.fromEntries(nrMock.setAttribute.mock.calls)).toMatchObject(NR_MOCK.event);
      expect(nrMock.setName).toHaveBeenCalledTimes(1);
      expect(nrMock.setName).toHaveBeenCalledWith('nrevent');
      expect(nrMock.save).toHaveBeenCalledTimes(1);
      expect(nrMock.interaction).toHaveBeenCalledTimes(2);
      expect(nrMock.end).toHaveBeenCalledTimes(2);
    });

    it('should process the nrApi event type', async () => {
      const publisherSpy = vi.spyOn(publisher, 'publish');

      const result = await stratum.publish('nrApiValid');

      expect(result).toBe(true);
      expect(publisherSpy).toHaveBeenCalledTimes(1);

      expect(nrMock.setAttribute).toHaveBeenCalledTimes(Object.keys(NR_MOCK.api).length);
      expect(Object.fromEntries(nrMock.setAttribute.mock.calls)).toMatchObject(NR_MOCK.api);
      expect(nrMock.setName).toHaveBeenCalledTimes(1);
      expect(nrMock.setName).toHaveBeenCalledWith('nrapiresponse');
      expect(nrMock.save).toHaveBeenCalledTimes(1);
      expect(nrMock.interaction).toHaveBeenCalledTimes(2);
      expect(nrMock.end).toHaveBeenCalledTimes(2);
    });

    it('should handle placeholders within the nrApi event type', async () => {
      const result = await stratum.publish('nrApiPlaceholders', SAMPLE_EVENT_OPTIONS);
      expect(result).toBe(true);
      const publishData = {
        ...Object.fromEntries(nrMock.setAttribute.mock.calls),
        ...{ name: nrMock.setName.mock.calls[0][0] }
      };
      const catalogEntry = NR_CATALOG.nrApiPlaceholders;
      const propertiesWithPlaceholders = Object.keys(catalogEntry).filter((k) =>
        // @ts-expect-error testing runtime handling with invalid types
        String(catalogEntry[k]).includes('{{')
      );
      propertiesWithPlaceholders.forEach((key) => {
        // @ts-expect-error testing runtime handling with invalid types
        const placeholder = catalogEntry[key].replace(/[{}]/g, '');
        const placeholderValue = PLACEHOLDERS[placeholder];
        expect(publishData[key]).toBe(placeholderValue);
      });
    });

    it('should process the nrError event type', async () => {
      const publisherSpy = vi.spyOn(publisher, 'publish');

      const result = await stratum.publish('nrErrorValid');

      expect(result).toBe(true);
      expect(publisherSpy).toHaveBeenCalledTimes(1);

      expect(nrMock.setAttribute).toHaveBeenCalledTimes(Object.keys(NR_MOCK.error).length);
      expect(Object.fromEntries(nrMock.setAttribute.mock.calls)).toMatchObject(NR_MOCK.error);
      expect(nrMock.setName).toHaveBeenCalledTimes(1);
      expect(nrMock.setName).toHaveBeenCalledWith('nrerror');
      expect(nrMock.save).toHaveBeenCalledTimes(1);
      expect(nrMock.interaction).toHaveBeenCalledTimes(2);
      expect(nrMock.end).toHaveBeenCalledTimes(2);
    });
  });

  describe('custom context', () => {
    let nrMock: ReturnType<typeof mockNewRelic>;
    beforeEach(() => {
      nrMock = mockNewRelic();
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
      await stratum.publish('nrEventValid');
      const attributes = Object.fromEntries(nrMock.setAttribute.mock.calls);
      expect(Object.keys(attributes)).not.toContain('stratum_myCustomVar');
      expect(Object.keys(attributes)).toContain('stratum_myCustomVar2');
    });

    it('should pass prefixed context variables when publishing nr events', async () => {
      nrpPlugin.setContext('myCustomVar', 'abc');
      nrpPlugin.setContext('myCustomVar2', false);
      await stratum.publish('nrEventValid');
      const attributes = Object.fromEntries(nrMock.setAttribute.mock.calls);
      expect(attributes.stratum_myCustomVar).toBe('abc');
      expect(attributes.stratum_myCustomVar2).toBe(false);
    });

    it('should include the default context when publishing other events', async () => {
      stratum.addPlugin(PluginAFactory());
      nrpPlugin.setContext('myCustomVar', 'test1');
      nrpPlugin.setContext('myCustomVar2', 'test2');
      const id = stratum.addCatalog({ items: SAMPLE_A_CATALOG, componentName: 'noop' }).id;
      await stratum.publishFromCatalog(id, 1);
      const attributes = Object.fromEntries(nrMock.setAttribute.mock.calls);
      expect(attributes.stratum_myCustomVar).toBe('test1');
      expect(attributes.stratum_myCustomVar2).toBe('test2');
    });
  });
});
