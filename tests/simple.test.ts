import { StratumEvent, StratumService } from '../src';
import { PRODUCT_NAME, PRODUCT_VERSION } from './utils/constants';
import { enableDebugMode, mockSessionId, restoreStratumMocks } from './utils/helpers';
import { BASE_TAG_CATALOG } from './utils/catalog';
import { BASE_EVENT_MOCK } from './utils/fixtures';

describe('load stratum without plugins', () => {
  let stratum: StratumService;

  beforeEach(() => {
    enableDebugMode(true);
    mockSessionId();
    stratum = new StratumService({
      productName: PRODUCT_NAME,
      productVersion: PRODUCT_VERSION
    });
  });

  afterEach(() => {
    restoreStratumMocks();
    jest.restoreAllMocks();
  });

  describe('add base tag model objects', () => {
    it('should allow adding catalogs containing base tag objects', async () => {
      const id = stratum.addCatalog({ tags: BASE_TAG_CATALOG });
      expect(id).toBeDefined();
      const catalog = stratum.catalogs[id];
      expect(catalog).toBeDefined();
      expect(catalog.isValid).toBe(true);
      expect(Object.keys(catalog.validTags)).toStrictEqual(['1', '2']);
    });
  });

  describe('allow publishing basic tags', () => {
    let id = '';

    beforeEach(() => {
      id = stratum.addCatalog({ tags: BASE_TAG_CATALOG });
    });

    it('should allow publishing tags', async () => {
      const listener = jest.fn();

      const event = await new Promise<StratumEvent>((resolve) => {
        listener.mockImplementation((event) => resolve(event));
        stratum.addEventListener(listener);
        stratum.publishFromCatalog(id, 1);
      });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(event).toEqual(BASE_EVENT_MOCK);
    });
  });
});
