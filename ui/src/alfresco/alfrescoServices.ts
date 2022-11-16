import {
  readyActiveMq,
  readyDb,
  readyRepo,
  readySolr,
  readyTransform,
  listAllContainers,
  readyAca,
  readyProxy,
} from '../helper/cli';

import { ServiceConfiguration } from './configuration';

export interface Service {
  id: string;
  name: string;
  state: ContainerState;
  status: string;
  image: string;
  imageName: string;
  version: string;
}
export const AlfrescoStates = Object.freeze({
  NOT_ACTIVE: 'NOT_ACTIVE',
  STARTING: 'STARTING',
  UP_AND_RUNNING: 'UP_AND_RUNNING',
  STOPPING: 'STOPPING',
  ERROR: 'ERROR',
});
export type AlfrescoState = keyof typeof AlfrescoStates;

export type ContainerState =
  | 'NO_CONTAINER'
  | 'RUNNING'
  | 'READY'
  | 'CREATED'
  | 'RESTARTING'
  | 'REMOVING'
  | 'PAUSED'
  | 'EXITED'
  | 'DEAD';
export interface ServiceStore {
  alfrescoState: AlfrescoState;
  services: Service[];
  errors: string[];
}
export type Action = {
  type: string;
  payload?: any;
  error?: string;
};

function emptyServiceDescFor(name: string, image: string): Service {
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

export function defaultAlfrescoState(
  configuration: ServiceConfiguration[]
): ServiceStore {
  return {
    alfrescoState: AlfrescoStates.NOT_ACTIVE,
    services: configuration.map((c) => emptyServiceDescFor(c.service, c.image)),
    errors: [],
  };
}

function updateStateWith(data: Service[], state: ServiceStore): ServiceStore {
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
      return newState;
    }
    case 'STOP_ALFRESCO': {
      newState.alfrescoState = AlfrescoStates.STOPPING;

      return newState;
    }
  }
  return state;
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

async function isReady(service: Service): Promise<boolean> {
  const readyCheckPolicies = Object.freeze({
    postgres: isReturningRows(readyDb),
    alfresco: isReturning200(readyRepo),
    'transform-core-aio': isReturning200(readyTransform),
    solr6: isReturning200(readySolr),
    activemq: isReturning200(readyActiveMq),
    'content-app': isReturning200(readyAca),
    proxy: isReturning200(readyProxy),
  });

  let readyFn = readyCheckPolicies[service.name];
  let isR = false;
  if (readyFn) {
    isR = await readyFn();
  }
  return isR;
}
function dockerAPIToContainerDesc(dockerAPIContainer): Service {
  const [imageName, imageTag] = dockerAPIContainer.Image.split(':');
  return {
    name: dockerAPIContainer.Names[0].substring(1),
    state: dockerAPIContainer.State.toUpperCase(),
    status: dockerAPIContainer.Status,
    image: dockerAPIContainer.Image,
    imageName,
    version: imageTag,
    id: dockerAPIContainer.Id,
  };
}
export async function getAlfrescoServices(
  serviceNames: string[]
): Promise<Service[]> {
  try {
    const containerList = await listAllContainers(serviceNames);
    const services: Service[] = containerList.map((e) => {
      return dockerAPIToContainerDesc(e);
    });
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
}
