import { type NewRelicPlugin, NewRelicPluginFactory } from '@plugins/new-relic';
import { NewRelicPlusPluginFactory } from '@plugins/new-relic-plus';
import { beforeEach, describe, expect, it } from 'vitest';
import { StratumService } from '@';
import {
  AB_TEST_SCHEMA,
  CATALOG_METADATA,
  METADATA_CATALOG_ID,
  mockNewRelic,
  mockSessionId,
  NR_CATALOG,
  NR_MOCK,
  PLUGIN_A_NAME,
  type PluginA,
  PluginAFactory,
  PRODUCT_NAME,
  PRODUCT_VERSION,
  SAMPLE_A_CATALOG
} from '../utils';

describe('publishing events via NewRelicPublisher', () => {
  let stratum: StratumService;
  let PluginA: PluginA;
  let NewRelicPlugin: NewRelicPlugin;
  let nrMock: ReturnType<typeof mockNewRelic>;

  const defaultContext = {
    var1: 'var1',
    var2: 'var2'
  };

  beforeEach(() => {
    nrMock = mockNewRelic();
    mockSessionId();
    PluginA = PluginAFactory({ defaultContext });
    NewRelicPlugin = NewRelicPluginFactory();
    stratum = new StratumService({
      plugins: [PluginA, NewRelicPlugin],
      productName: PRODUCT_NAME,
      productVersion: PRODUCT_VERSION
    });
    stratum.addCatalog({ items: SAMPLE_A_CATALOG, ...CATALOG_METADATA });
    stratum.startAbTest(AB_TEST_SCHEMA);
  });

  it('should make a call to window.newrelic', async () => {
    const result = await stratum.publishFromCatalog(METADATA_CATALOG_ID, 1, {
      replacements: { PLACEHOLDER_2: 'testEvent' }
    });

    expect(result).toBe(true);
    expect(nrMock.setAttribute).toHaveBeenCalledTimes(Object.keys(NR_MOCK.sampleA).length);
    expect(Object.fromEntries(nrMock.setAttribute.mock.calls)).toMatchObject(NR_MOCK.sampleA);
    expect(nrMock.setName).toHaveBeenCalledTimes(1);
    expect(nrMock.setName).toHaveBeenCalledWith('testEvent');
    expect(nrMock.save).toHaveBeenCalledTimes(1);
    expect(nrMock.interaction).toHaveBeenCalledTimes(2);
    expect(nrMock.end).toHaveBeenCalledTimes(2);
  });

  it('should apply ab test data, if provided', async () => {
    const result = await stratum.publishFromCatalog(METADATA_CATALOG_ID, 1, {
      replacements: { PLACEHOLDER_2: 'testEvent' }
    });

    expect(result).toBe(true);
    expect(nrMock.setAttribute).toHaveBeenCalledTimes(Object.keys(NR_MOCK.sampleA).length);
    expect(Object.fromEntries(nrMock.setAttribute.mock.calls)).toMatchObject(NR_MOCK.sampleA);
    expect(nrMock.setName).toHaveBeenCalledTimes(1);
    expect(nrMock.setName).toHaveBeenCalledWith('testEvent');
    expect(nrMock.save).toHaveBeenCalledTimes(1);
    expect(nrMock.interaction).toHaveBeenCalledTimes(2);
    expect(nrMock.end).toHaveBeenCalledTimes(2);
  });

  it('should apply isValid attribute, if provided', async () => {
    const result = await stratum.publishFromCatalog(METADATA_CATALOG_ID, 1, {
      pluginData: {
        newRelic: { isValid: true }
      }
    });

    expect(result).toBe(true);
    expect(nrMock.setAttribute.mock.calls.find((x) => x[0] === 'isValid')?.[1]).toBe(true);
  });

  it('should apply context data from other plugins', async () => {
    // Re-declare the stratum service with the NR+ plugin instead
    stratum = new StratumService({
      plugins: [PluginA],
      productName: PRODUCT_NAME,
      productVersion: PRODUCT_VERSION
    });
    const nrpPlugin = NewRelicPlusPluginFactory();
    stratum.addPlugin(nrpPlugin);
    const id = stratum.addCatalog({ items: NR_CATALOG, ...CATALOG_METADATA }).id;
    const result = await stratum.publishFromCatalog(id, 'nrApiValid');

    expect(result).toBe(true);
    for (const [key, value] of Object.entries(defaultContext)) {
      expect(nrMock.setAttribute).toHaveBeenCalledWith(`${PLUGIN_A_NAME}_${key}`, value);
    }
  });
});
