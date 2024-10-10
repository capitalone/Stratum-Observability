import { StratumService } from '../../src';
import { NewRelicPluginFactory, NewRelicPlugin } from '../../src/plugins/new-relic';
import { NewRelicPlusPluginFactory } from '../../src/plugins/new-relic-plus';
import {
  CATALOG_METADATA,
  PRODUCT_NAME,
  PRODUCT_VERSION,
  AB_TEST_SCHEMA,
  METADATA_CATALOG_ID
} from '../utils/constants';
import { NR_TAG_CATALOG, SAMPLE_A_CATALOG } from '../utils/catalog';
import { NR_MOCK } from '../utils/fixtures';
import { mockCrypto, mockNewRelic, mockSessionId, restoreStratumMocks } from '../utils/helpers';
import { PLUGIN_A_NAME, PluginA, PluginAFactory } from '../utils/sample-plugin';

describe('publishing tags via NewRelicPublisher', () => {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const w = window as any;
  let stratum: StratumService;
  let PluginA: PluginA;
  let NewRelicPlugin: NewRelicPlugin;

  const defaultContext = {
    var1: 'var1',
    var2: 'var2'
  };

  beforeEach(() => {
    mockCrypto();
    mockNewRelic();
    mockSessionId();
    PluginA = PluginAFactory({ defaultContext });
    NewRelicPlugin = NewRelicPluginFactory();
    stratum = new StratumService({
      plugins: [PluginA, NewRelicPlugin],
      productName: PRODUCT_NAME,
      productVersion: PRODUCT_VERSION
    });
    stratum.addCatalog({ tags: SAMPLE_A_CATALOG, ...CATALOG_METADATA });
    stratum.startAbTest(AB_TEST_SCHEMA);
  });

  afterEach(() => {
    restoreStratumMocks();
    jest.restoreAllMocks();
  });

  it('should make a call to window.newrelic', async () => {
    const interactionSpy = jest.spyOn(w.newrelic, 'interaction');
    const endSpy = jest.spyOn(w.newrelic, 'end');
    const saveSpy = jest.spyOn(w.newrelic, 'save');
    const setAttributeSpy = jest.spyOn(w.newrelic, 'setAttribute');
    const setNameSpy = jest.spyOn(w.newrelic, 'setName');

    const result = await stratum.publishFromCatalog(METADATA_CATALOG_ID, 1, {
      replacements: { PLACEHOLDER_2: 'testTag' }
    });

    expect(result).toBe(true);
    expect(setAttributeSpy).toHaveBeenCalledTimes(Object.keys(NR_MOCK.sampleA).length);
    expect(Object.fromEntries(setAttributeSpy.mock.calls)).toMatchObject(NR_MOCK.sampleA);
    expect(setNameSpy).toHaveBeenCalledTimes(1);
    expect(setNameSpy).toHaveBeenCalledWith('testTag');
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(interactionSpy).toHaveBeenCalledTimes(2);
    expect(endSpy).toHaveBeenCalledTimes(2);
  });

  it('should apply ab test data, if provided', async () => {
    const interactionSpy = jest.spyOn(w.newrelic, 'interaction');
    const saveSpy = jest.spyOn(w.newrelic, 'save');
    const endSpy = jest.spyOn(w.newrelic, 'end');
    const setAttributeSpy = jest.spyOn(w.newrelic, 'setAttribute');
    const setNameSpy = jest.spyOn(w.newrelic, 'setName');

    const result = await stratum.publishFromCatalog(METADATA_CATALOG_ID, 1, {
      replacements: { PLACEHOLDER_2: 'testTag' }
    });

    expect(result).toBe(true);
    expect(setAttributeSpy).toHaveBeenCalledTimes(Object.keys(NR_MOCK.sampleA).length);
    expect(Object.fromEntries(setAttributeSpy.mock.calls)).toMatchObject(NR_MOCK.sampleA);
    expect(setNameSpy).toHaveBeenCalledTimes(1);
    expect(setNameSpy).toHaveBeenCalledWith('testTag');
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(interactionSpy).toHaveBeenCalledTimes(2);
    expect(endSpy).toHaveBeenCalledTimes(2);
  });

  it('should apply isValid attribute, if provided', async () => {
    const setAttributeSpy = jest.spyOn(w.newrelic, 'setAttribute');

    const result = await stratum.publishFromCatalog(METADATA_CATALOG_ID, 1, {
      pluginData: {
        newRelic: { isValid: true }
      }
    });

    expect(result).toBe(true);
    expect(setAttributeSpy.mock.calls.find((x) => x[0] === 'isValid')?.[1]).toBe(true);
  });

  it('should apply context data from other plugins', async () => {
    const setAttributeSpy = jest.spyOn(w.newrelic, 'setAttribute');

    // Re-declare the stratum service with the NR+ plugin instead
    stratum = new StratumService({
      plugins: [PluginA],
      productName: PRODUCT_NAME,
      productVersion: PRODUCT_VERSION
    });
    const nrpPlugin = NewRelicPlusPluginFactory();
    stratum.addPlugin(nrpPlugin);
    const id = stratum.addCatalog({ tags: NR_TAG_CATALOG, ...CATALOG_METADATA });
    const result = await stratum.publishFromCatalog(id, 'nrApiValid');

    expect(result).toBe(true);
    for (const [key, value] of Object.entries(defaultContext)) {
      expect(setAttributeSpy).toHaveBeenCalledWith(`${PLUGIN_A_NAME}_${key}`, value);
    }
  });
});
