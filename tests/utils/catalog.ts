import { NewRelicEventType, NewRelicTags } from '../../src/plugins/new-relic-plus';
import { TagCatalog } from '../../src/types';
import { ATagObject, BTagObject, SampleEventType } from './sample-plugin';

export const SAMPLE_A_CATALOG: TagCatalog<ATagObject> = {
  1: {
    eventType: SampleEventType.A,
    name: '${PLACEHOLDER_2}',
    prop1: 'prop1',
    prop2: 'prop2',
    tagDescription: 'tag 1',
    tagId: 1
  },
  2: {
    eventType: SampleEventType.A,
    name: 'name2',
    prop1: 'abc',
    prop2: '123',
    tagDescription: 'tag 2',
    tagId: 2
  },
  3: {
    eventType: SampleEventType.A,
    name: 'name3',
    prop1: 'xyz',
    prop2: '789',
    tagDescription: 'tag 3',
    tagId: 4
  },
  4: {
    eventType: SampleEventType.A,
    name: 'name4',
    prop1: 'mmm',
    prop2: 'nnn',
    tagDescription: 'tag 4',
    tagId: 8
  }
};

export const SAMPLE_A_CATALOG_2: TagCatalog<ATagObject> = {
  abc: {
    eventType: SampleEventType.A,
    name: 'abc',
    prop1: '1prop',
    prop2: '2prop',
    tagDescription: 'tag 3',
    tagId: 1000
  }
};

export const SAMPLE_B_CATALOG: TagCatalog<BTagObject> = {
  1: {
    eventType: SampleEventType.B,
    prop3: true,
    prop4: 1,
    tagDescription: 'tag 1',
    tagId: 1
  },
  2: {
    eventType: SampleEventType.B,
    prop3: false,
    prop4: 0,
    prop5: 'prop5',
    tagDescription: 'tag 2',
    tagId: 1
  }
};

export const INVALID_SAMPLE_CATALOG: any = {
  0: {},
  1: {
    eventType: SampleEventType.A,
    prop1: 'prop1',
    tagDescription: ''
  },
  3: {
    eventType: SampleEventType.B
  },
  correct: {
    eventType: SampleEventType.A,
    prop1: 'prop1',
    prop2: 'prop2',
    tagDescription: 'tag 1',
    tagId: 1
  },
  duplicate: {
    eventType: SampleEventType.A,
    prop1: 'prop1',
    prop2: 'prop2',
    tagDescription: 'tag 1',
    tagId: 1
  }
};

export const NR_TAG_CATALOG: TagCatalog<NewRelicTags> = {
  nrEventValid: {
    eventType: NewRelicEventType.EVENT,
    message: 'abc',
    name: 'nrevent',
    tagDescription: 'description',
    tagId: 100
  },
  nrEventInvalid: {
    eventType: NewRelicEventType.EVENT,
    name: '',
    tagDescription: 'description',
    tagId: 101
  },
  nrApiValid: {
    eventType: NewRelicEventType.API_RESPONSE,
    message: 'abc',
    featureName: 'featureName',
    name: 'nrapiresponse',
    requestHeaders: 'requestHeaders',
    requestUri: 'requestUri',
    statusCode: 'statusCode',
    statusText: 'statusText',
    tagDescription: 'description',
    tagId: 102
  },
  nrApiInvalid: {
    eventType: NewRelicEventType.API_RESPONSE,
    name: 'nrapiresponse',
    requestHeaders: '',
    statusText: '',
    tagDescription: 'description',
    tagId: 103
  } as any,
  nrErrorValid: {
    errorCode: 'myerrorcode',
    errorText: 'errortext',
    eventType: NewRelicEventType.ERROR,
    featureName: 'featureName',
    isVisual: false,
    message: 'errormessage',
    name: 'nrerror',
    reason: 'myreason',
    tagDescription: 'description',
    tagId: 104
  },
  nrErrorInvalid: {
    eventType: NewRelicEventType.ERROR,
    name: 'nrerror',
    tagDescription: 'description',
    tagId: 104
  } as any
};

export const BASE_TAG_CATALOG: TagCatalog = {
  1: {
    eventType: 'base',
    tagDescription: 'base tag 1',
    tagId: 1
  },
  2: {
    eventType: 'base',
    tagDescription: 'base tag 2',
    tagId: 2
  }
};
