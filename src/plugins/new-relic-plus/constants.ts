/**
 * Event type enum that can be used to define New Relic-specific event
 * types within a catalog. Each event type corresponds to a
 * specific StratumEvent and EventModel.
 */
export enum NewRelicEventType {
  API_RESPONSE = 'nrApiResponse',
  ERROR = 'nrError',
  EVENT = 'nrEvent'
}
