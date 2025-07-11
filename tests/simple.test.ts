import { StratumSnapshot, StratumService } from '../src';
import { PRODUCT_NAME, PRODUCT_VERSION } from './utils/constants';
import { enableDebugMode, mockSessionId, restoreStratumMocks } from './utils/helpers';
import { BASE_CATALOG } from './utils/catalog';
import { BASE_EVENT_MOCK } from './utils/fixtures';
import { BrowserConsolePlugin } from '../src/plugins/browser-console';

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

  describe('add base events', () => {
    it('should allow adding catalogs containing base events', async () => {
      const id = stratum.addCatalog({ items: BASE_CATALOG });
      expect(id).toBeDefined();
      const catalog = stratum.catalogs[id];
      expect(catalog).toBeDefined();
      expect(catalog.isValid).toBe(true);
      expect(Object.keys(catalog.validModels)).toStrictEqual(['1', '2']);
    });

    it('should use event key as id when id field is omitted', () => {
      const stratumWithPlugin = new StratumService({
        productName: 'test',
        productVersion: '1.0',
        plugins: [new BrowserConsolePlugin()],
        catalog: {
          items: {
            'app-loaded': {
              eventType: 'base',
              description: 'Application loaded'
              // id field omitted - should use 'app-loaded' as the id
            },
            'user-login': {
              eventType: 'base',
              description: 'User logged in',
              id: 'custom-id' // explicit id should still work
            }
          }
        }
      });

      const catalog = stratumWithPlugin.defaultCatalog;
      expect(catalog).toBeDefined();
      expect(catalog?.isValid).toBe(true);

      // Verify that the omitted id uses the key
      expect(catalog?.validModels['app-loaded'].id).toBe('app-loaded');

      // Verify that explicit id still works
      expect(catalog?.validModels['user-login'].id).toBe('custom-id');
    });
  });

  describe('allow publishing base events', () => {
    let id = '';

    beforeEach(() => {
      id = stratum.addCatalog({ items: BASE_CATALOG });
    });

    it('should allow publishing  events', async () => {
      const listener = jest.fn();

      const event = await new Promise<StratumSnapshot>((resolve) => {
        listener.mockImplementation((event) => resolve(event));
        stratum.addSnapshotListener(listener);
        stratum.publishFromCatalog(id, 1);
      });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(event).toEqual(BASE_EVENT_MOCK);
    });
  });
});
