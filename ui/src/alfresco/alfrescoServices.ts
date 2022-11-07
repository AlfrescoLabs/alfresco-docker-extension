import {
  readyActiveMq,
  readyDb,
  readyRepo,
  readySolr,
  readyTransform,
  alfrescoContainers,
  createNetwork,
  deployDb,
  deployMq,
  deployTransform,
  deploySolr,
  waitTillReadyDb,
  deployRepository,
  stopContainers,
} from '../helper/cli';

import {
  ACTIVEMQ_IMAGE_TAG,
  POSTGRES_IMAGE_TAG,
  REPO_IMAGE_TAG,
  SOLR_IMAGE_TAG,
  TRANSFORM_IMAGE_TAG,
  ServiceDescriptor,
  ContainerState,
} from '../helper/constants';

export const AlfrescoStates = Object.freeze({
  NOT_ACTIVE: 'NOT_ACTIVE',
  STARTING: 'STARTING',
  UP_AND_RUNNING: 'UP_AND_RUNNING',
  STOPPING: 'STOPPING',
  ERROR: 'ERROR',
});
export type AlfrescoState = keyof typeof AlfrescoStates;

export interface ServiceStore {
  alfrescoState: AlfrescoState;
  services: ServiceDescriptor[];
  errors: string[];
}
export type Action = {
  type: string;
  payload?: any;
  error?: string;
};

function emptyServiceDescFor(name: string, image: string): ServiceDescriptor {
  let [imageName, version] = image.split(':');
  return {
    id: '',
    name: name,
    state: 'NO_CONTAINER',
    status: '',
    image: image,
    imageName,
    version,
  };
}

export const actions = ['RUN_SERVICES', 'STOP_SERVICES'];
export const AppStateQueries = {
  canRun: (state: AlfrescoState) => {
    return state === AlfrescoStates.NOT_ACTIVE;
  },
  canStop: (state: AlfrescoState) =>
    state !== AlfrescoStates.NOT_ACTIVE && state !== AlfrescoStates.STOPPING,
  isLoading: (state: AlfrescoState) => state === AlfrescoStates.STARTING,
  isReady: (state: AlfrescoState) => state === AlfrescoStates.UP_AND_RUNNING,
  isStopping: (state: AlfrescoState) => state === AlfrescoStates.STOPPING,
};
export function defaultAlfrescoState(): ServiceStore {
  return {
    alfrescoState: AlfrescoStates.NOT_ACTIVE,
    services: [
      emptyServiceDescFor('alfresco', REPO_IMAGE_TAG),
      emptyServiceDescFor('postgres', POSTGRES_IMAGE_TAG),
      emptyServiceDescFor('activemq', ACTIVEMQ_IMAGE_TAG),
      emptyServiceDescFor('solr6', SOLR_IMAGE_TAG),
      emptyServiceDescFor('transform-core-aio', TRANSFORM_IMAGE_TAG),
    ],
    errors: [],
  };
}

const runContainers = async () => {
  await createNetwork();
  await deployDb();
  await deployMq();
  await deployTransform();
  await deploySolr();

  await waitTillReadyDb();
  await deployRepository();
};

function updateStateWith(
  data: ServiceDescriptor[],
  state: ServiceStore
): ServiceStore {
  for (let curr of state.services) {
    let contState: ContainerState = 'NO_CONTAINER';

    for (let container of data) {
      if (curr.name === container.name) {
        curr.id = container.id;
        contState = container.state;
        curr.state = container.state;
        curr.status = container.status;
        break;
      }
    }
    curr.state = contState;
  }
  return state;
}

function updateAlfrescoAppState(store: ServiceStore) {
  if (store.services.every((c) => c.state === 'READY')) {
    store.alfrescoState = AlfrescoStates.UP_AND_RUNNING;
    return store;
  }

  if (store.services.every((c) => c.state === 'NO_CONTAINER')) {
    store.alfrescoState = AlfrescoStates.NOT_ACTIVE;
    return store;
  }

  if (store.alfrescoState !== AlfrescoStates.STOPPING) {
    if (store.services.some((c) => c.state === 'RUNNING')) {
      store.alfrescoState = AlfrescoStates.STARTING;
      return store;
    }
    if (store.services.every((c) => c.state === 'EXITED')) {
      store.alfrescoState = AlfrescoStates.ERROR;
      store.errors.push(
        'Containers were not properly removed - click stop to remove them.'
      );
      return store;
    }
    if (
      store.services.some(
        (c) =>
          c.state === 'DEAD' ||
          c.state === 'EXITED' ||
          c.state === 'NO_CONTAINER'
      )
    ) {
      store.alfrescoState = AlfrescoStates.ERROR;
      return store;
    }
  }
  return store;
}

export function serviceReducer(
  state: ServiceStore,
  action: Action
): ServiceStore {
  let newState: ServiceStore = { ...state, errors: [] };
  switch (action.type) {
    case 'REFRESH_SERVICE_STATE': {
      return updateAlfrescoAppState(updateStateWith(action.payload, newState));
    }
    case 'START_ALFRESCO': {
      newState.alfrescoState = AlfrescoStates.STARTING;
      runContainers();
      return newState;
    }
    case 'STOP_ALFRESCO': {
      newState.alfrescoState = AlfrescoStates.STOPPING;
      stopContainers();
      return newState;
    }
  }
  return defaultAlfrescoState();
}

function isReturning200(restCall) {
  return async () => {
    let status: string = await restCall();
    return status === '200';
  };
}
function isReturningRows(restCall) {
  return async () => {
    let status: string = await restCall();
    return status.includes('rows');
  };
}

async function isReady(service: ServiceDescriptor): Promise<boolean> {
  const readyCheckPolicies = Object.freeze({
    postgres: isReturningRows(readyDb),
    alfresco: isReturning200(readyRepo),
    'transform-core-aio': isReturning200(readyTransform),
    solr6: isReturning200(readySolr),
    activemq: isReturning200(readyActiveMq),
  });

  let readyFn = readyCheckPolicies[service.name];
  let isR = false;
  if (readyFn) {
    isR = await readyFn();
  }
  return isR;
}

export async function getAlfrescoServices() {
  let services = [];
  try {
    services = await alfrescoContainers();
    for (let i = 0; i < services.length; i++) {
      if (services[i].state === 'RUNNING')
        services[i].state = (await isReady(services[i]))
          ? 'READY'
          : services[i].state;
    }
    return services;
  } catch (err) {
    console.log(err);
  }
  return services;
}
