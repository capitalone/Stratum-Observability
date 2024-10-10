/**
 * Event type enum that can be used to define New Relic-specific event
 * types within a tag catalog. Each event type corresponds to a
 * specific TagObject and TagModel.
 */
export enum NewRelicEventType {
  API_RESPONSE = 'nrApiResponse',
  ERROR = 'nrError',
  EVENT = 'nrEvent'
}
