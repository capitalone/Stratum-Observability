import type { GenericPlugin } from './plugin';
import type { DefaultTagCatalogOptions } from './tag';

/**
 * Options passed into the StratumService on initialization.
 */
export interface StratumServiceOptions {
  /**
   * Tag catalog metadata that can be optionally provided to
   * the service. The catalog registered via this property
   * will be stored as the default catalog.
   */
  catalog?: DefaultTagCatalogOptions;

  /**
   * Name of the application that is implementing Stratum.
   * This is a required value and is automatically populated based on
   * the respective value in StratumServiceOptions.
   */
  productName: string;

  /**
   * Version of the application that is implementing Stratum.
   * This is a required value and is automatically populated based on the
   * respective value in StratumServiceOptions.
   */
  productVersion: string;

  /**
   * Plugins to dynamically add to the service.
   *
   * A plugin is composed of one or more custom tag models (with
   * tag catalog entries) and publisher models.
   *
   * Plugins can be used to leverage the tag catalog functionality
   * in a new way or to override the default behavior of default
   * tags/publishers.
   */
  plugins?: GenericPlugin | GenericPlugin[];
}
