/**
 * Schema data used to define an A/B test experiment
 */
export interface AbTestSchema {
  /**
   * The name of the A/B test being conducted.
   */
  name: string;

  /**
   * List of variation identifiers of the
   * A/B test. Typically, this should contain the
   * feature toggles/values for the active
   * variation.
   */
  variationIds: string[];

  /**
   * The variation of the A/B test that the user is currently
   * participating in.
   */
  testGroup: string;

  /**
   * The weight of the A/B test variation that is being served
   * to the customer.
   */
  testWeight: string;
}

/**
 * Wrapper class around AbTestSchema when test data is
 * registered within AbTestManager by StratumService.
 */
export interface AbTest {
  /**
   * Flag denoting the unique id of the AbTest instance.
   * This id is generated when registered by AbTestManager.
   */
  id: string;

  /**
   * Underlying AbTestSchema data associated with the AbTest
   */
  data: AbTestSchema;
}

/**
 * Collection of AbTest instances keyed by AbTest.id
 */
export type AbTestCollection = { [key: string]: AbTest };
