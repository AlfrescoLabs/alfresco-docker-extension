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
  //INSTALLING: 'INSTALLING',
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

function updateStateWith(state: ServiceStore, data: ServiceDescriptor[]) {
  for (let curr of state.services) {
    let contState: ContainerState = 'NO_CONTAINER';
    for (let s of data) {
      if (curr.name === s.name) {
        contState = s.state;
        curr.status = s.status;
        break;
      }
    }
    curr.state = contState;
  }
}

function updateAlfrescoAppState(state: ServiceStore) {
  if (state.services.every((c) => c.state === 'READY')) {
    state.alfrescoState = AlfrescoStates.UP_AND_RUNNING;
    return;
  }

  if (state.services.every((c) => c.state === 'NO_CONTAINER')) {
    state.alfrescoState = AlfrescoStates.NOT_ACTIVE;
    return;
  }

  if (state.alfrescoState !== AlfrescoStates.STOPPING) {
    if (state.services.some((c) => c.state === 'RUNNING')) {
      state.alfrescoState = AlfrescoStates.STARTING;
      return;
    }
    if (
      state.services.some(
        (c) =>
          c.state === 'DEAD' ||
          c.state === 'EXITED' ||
          c.state === 'NO_CONTAINER'
      )
    ) {
      state.alfrescoState = AlfrescoStates.ERROR;
      return;
    }
  }
}

export function serviceReducer(
  state: ServiceStore,
  action: Action
): ServiceStore {
  console.log(action);
  let newState: ServiceStore = { ...state };
  switch (action.type) {
    case 'REFRESH_SERVICE_STATE': {
      updateStateWith(newState, action.payload);
      updateAlfrescoAppState(newState);
      return newState;
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

const readyCheckPolicies = {
  postgres: isReturningRows(readyDb),
  alfresco: isReturning200(readyRepo),
  'transform-core-aio': isReturning200(readyTransform),
  solr6: isReturning200(readySolr),
  activemq: isReturning200(readyActiveMq),
};
async function checkServiceStatus(
  service: ServiceDescriptor
): Promise<ContainerState> {
  let readyFn = readyCheckPolicies[service.name];
  let isR = false;
  if (readyFn) {
    isR = await readyFn();
  }
  return isR ? 'READY' : service.state;
}

export async function getAlfrescoServices() {
  let services = [];
  try {
    services = await alfrescoContainers();

    for (let i = 0; i < services.length; i++) {
      if (services[i].state === 'RUNNING')
        services[i].state = await checkServiceStatus(services[i]);
    }
    return services;
  } catch (err) {
    console.log(err);
    // TODO do be managed differently
  }
  return services;
}
