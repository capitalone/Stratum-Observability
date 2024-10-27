import { BaseEventModel } from '../../base';
import { EventOptions } from '../../types';
import { NewRelicApiResponseEvent, NewRelicErrorEvent, NewRelicEvent } from './types';

/**
 * Wrapper class for the NewRelicEvent interface.
 *
 * Extends BaseEventModel and adds additional properties
 * to send to New Relic.
 */
export class NewRelicEventModel<
  T extends NewRelicEvent<string> = NewRelicEvent
> extends BaseEventModel<T> {
  /**
   * Data object that has been processed by BaseEventModel to replace
   * dynamic placeholders.
   *
   * Use this value on the source to explicitly define which fields to
   * send to New Relic via NewRelicPlusPublisher.
   */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  protected processedNewRelicData: any;

  protected checkValidity(): boolean {
    let isValid = super.checkValidity();
    if (typeof this.item.name !== 'string' || this.item.name === '') {
      isValid = false;
      this.addValidationError('Event name must have a non-empty string value.');
    }
    return isValid;
  }

  getData(options?: Partial<EventOptions>) {
    this.processedNewRelicData = super.getData(options);
    return {
      context: this.processedNewRelicData.context,
      featureName: this.processedNewRelicData.featureName,
      message: this.processedNewRelicData.message,
      name: this.processedNewRelicData.name,
      id: '' + this.processedNewRelicData.id
    };
  }
}

/**
 * Wrapper class for the NewRelicApiResponseEvent interface.
 *
 * Extends NewRelicEventModel and adds additional properties
 * to send to New Relic.
 */
export class NewRelicApiResponseEventModel extends NewRelicEventModel<NewRelicApiResponseEvent> {
  protected checkValidity(): boolean {
    let isValid = super.checkValidity();
    if (typeof this.item.requestUri !== 'string') {
      isValid = false;
      this.addValidationError('Field "requestUri" must be a string.');
    }
    if (typeof this.item.statusCode !== 'string') {
      isValid = false;
      this.addValidationError('Field "statusCode" must be a string.');
    }
    return isValid;
  }

  getData(options?: Partial<EventOptions>) {
    const item = super.getData(options);
    return Object.assign(item, {
      requestHeaders: this.item.requestHeaders,
      requestUri: this.item.requestUri,
      statusCode: this.item.statusCode,
      statusText: this.item.statusText
    });
  }
}

/**
 * Wrapper class for the NewRelicErrorEvent interface.
 *
 * Extends NewRelicEventModel and adds additional properties
 * to send to New Relic.
 */
export class NewRelicErrorEventModel extends NewRelicEventModel<NewRelicErrorEvent> {
  protected checkValidity(): boolean {
    let isValid = super.checkValidity();
    if (typeof this.item.errorCode !== 'string') {
      isValid = false;
      this.addValidationError('Field "errorCode" must be a string.');
    }
    return isValid;
  }

  getData(options?: Partial<EventOptions>) {
    const item = super.getData(options);
    return Object.assign(item, {
      errorCode: this.processedNewRelicData.errorCode,
      errorText: this.processedNewRelicData.errorText,
      isVisual: this.processedNewRelicData.isVisual,
      reason: this.processedNewRelicData.reason
    });
  }
}
