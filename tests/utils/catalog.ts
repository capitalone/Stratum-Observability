import { NewRelicEventType, NewRelicEvents } from '../../src/plugins/new-relic-plus';
import { StratumCatalog } from '../../src/types';
import { AEvent, BEvent, SampleEventType } from './sample-plugin';

export const SAMPLE_A_CATALOG: StratumCatalog<AEvent> = {
  1: {
    eventType: SampleEventType.A,
    name: '{{PLACEHOLDER_2}}',
    prop1: 'prop1',
    prop2: 'prop2',
    description: 'event 1',
    id: 1
  },
  2: {
    eventType: SampleEventType.A,
    name: 'name2',
    prop1: 'abc',
    prop2: '123',
    description: 'event 2',
    id: 2
  },
  3: {
    eventType: SampleEventType.A,
    name: 'name3',
    prop1: 'xyz',
    prop2: '789',
    description: 'event 3',
    id: 4
  },
  4: {
    eventType: SampleEventType.A,
    name: 'name4',
    prop1: 'mmm',
    prop2: 'nnn',
    description: 'event 4',
    id: 8
  }
};

export const SAMPLE_A_CATALOG_2: StratumCatalog<AEvent> = {
  abc: {
    eventType: SampleEventType.A,
    name: 'abc',
    prop1: '1prop',
    prop2: '2prop',
    description: 'event 3',
    id: 1000
  }
};

export const SAMPLE_B_CATALOG: StratumCatalog<BEvent> = {
  1: {
    eventType: SampleEventType.B,
    prop3: true,
    prop4: 1,
    description: 'event 1',
    id: 1
  },
  2: {
    eventType: SampleEventType.B,
    prop3: false,
    prop4: 0,
    prop5: 'prop5',
    description: 'event 2',
    id: 1
  }
};

export const INVALID_SAMPLE_CATALOG: any = {
  0: {},
  1: {
    eventType: SampleEventType.A,
    prop1: 'prop1'
  },
  3: {
    eventType: SampleEventType.B
  },
  correct: {
    eventType: SampleEventType.A,
    prop1: 'prop1',
    prop2: 'prop2',
    description: 'event 1',
    id: 1
  },
  duplicate: {
    eventType: SampleEventType.A,
    prop1: 'prop1',
    prop2: 'prop2',
    description: 'event 1',
    id: 1
  }
};

export const NR_CATALOG: StratumCatalog<NewRelicEvents> = {
  nrEventValid: {
    eventType: NewRelicEventType.EVENT,
    message: 'abc',
    name: 'nrevent',
    description: 'description',
    id: 100
  },
  nrEventInvalid: {
    eventType: NewRelicEventType.EVENT,
    name: '',
    description: 'description',
    id: 101
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
    description: 'description',
    id: 102
  },
  nrApiInvalid: {
    eventType: NewRelicEventType.API_RESPONSE,
    name: 'nrapiresponse',
    requestHeaders: '',
    statusText: '',
    description: 'description',
    id: 103
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
    description: 'description',
    id: 104
  },
  nrErrorInvalid: {
    eventType: NewRelicEventType.ERROR,
    name: 'nrerror',
    description: 'description',
    id: 104
  } as any
};

export const BASE_CATALOG: StratumCatalog = {
  1: {
    eventType: 'base',
    description: 'base event 1',
    id: 1
  },
  2: {
    eventType: 'base',
    description: 'base event 2',
    id: 2
  }
};
