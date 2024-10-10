import { BaseTagModel } from '../../base';
import { TagOptions } from '../../types';
import { NewRelicApiResponseTagObject, NewRelicErrorTagObject, NewRelicEventTagObject } from './types';

/**
 * Wrapper class for the NewRelicEventTagObject interface.
 *
 * Extends BaseTagModel and adds additional properties
 * to send to New Relic.
 */
export class NewRelicEventTagModel<
  T extends NewRelicEventTagObject<string> = NewRelicEventTagObject
> extends BaseTagModel<T> {
  /**
   * Tag data object that has been processed by BaseTagModel to replace
   * dynamic placeholders.
   *
   * Use this value on the source to explicitly define which fields to
   * send to New Relic via NewRelicPlusPublisher.
   */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  protected processedNewRelicTagData: any;

  protected checkValidity(): boolean {
    let isValid = super.checkValidity();
    if (typeof this.tag.name !== 'string' || this.tag.name === '') {
      isValid = false;
      this.addValidationError('Event name must have a non-empty string value.');
    }
    return isValid;
  }

  getData(options?: Partial<TagOptions>) {
    this.processedNewRelicTagData = super.getData(options);
    return {
      context: this.processedNewRelicTagData.context,
      featureName: this.processedNewRelicTagData.featureName,
      message: this.processedNewRelicTagData.message,
      name: this.processedNewRelicTagData.name,
      tagId: '' + this.processedNewRelicTagData.tagId
    };
  }
}

/**
 * Wrapper class for the NewRelicApiResponseTagObject interface.
 *
 * Extends NewRelicEventTagModel and adds additional properties
 * to send to New Relic.
 */
export class NewRelicApiResponseTagModel extends NewRelicEventTagModel<NewRelicApiResponseTagObject> {
  protected checkValidity(): boolean {
    let isValid = super.checkValidity();
    if (typeof this.tag.requestUri !== 'string') {
      isValid = false;
      this.addValidationError('Field "requestUri" must be a string.');
    }
    if (typeof this.tag.statusCode !== 'string') {
      isValid = false;
      this.addValidationError('Field "statusCode" must be a string.');
    }
    return isValid;
  }

  getData(options?: Partial<TagOptions>) {
    const tag = super.getData(options);
    return Object.assign(tag, {
      requestHeaders: this.processedNewRelicTagData.requestHeaders,
      requestUri: this.processedNewRelicTagData.requestUri,
      statusCode: this.processedNewRelicTagData.statusCode,
      statusText: this.processedNewRelicTagData.statusText
    });
  }
}

/**
 * Wrapper class for the NewRelicApiResponseTagObject interface.
 *
 * Extends NewRelicEventTagModel and adds additional properties
 * to send to New Relic.
 */
export class NewRelicErrorTagModel extends NewRelicEventTagModel<NewRelicErrorTagObject> {
  protected checkValidity(): boolean {
    let isValid = super.checkValidity();
    if (typeof this.tag.errorCode !== 'string') {
      isValid = false;
      this.addValidationError('Field "errorCode" must be a string.');
    }
    return isValid;
  }

  getData(options?: Partial<TagOptions>) {
    const tag = super.getData(options);
    return Object.assign(tag, {
      errorCode: this.processedNewRelicTagData.errorCode,
      errorText: this.processedNewRelicTagData.errorText,
      isVisual: this.processedNewRelicTagData.isVisual,
      reason: this.processedNewRelicTagData.reason
    });
  }
}
