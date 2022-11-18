import { listAllContainers } from '../helper/cli';
import {
  AlfrescoStates,
  Service,
  ServiceStore,
  Action,
  ContainerState,
  ServiceConfiguration,
} from './types';
import { isReady } from './checkServiceReadiness';

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

export function defaultAlfrescoState(
  configuration: ServiceConfiguration[]
): ServiceStore {
  return {
    alfrescoState: AlfrescoStates.NOT_ACTIVE,
    configuration,
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
  serviceConf: ServiceConfiguration[]
): Promise<Service[]> {
  try {
    const containerList = await listAllContainers(serviceConf);
    const services: Service[] = containerList.map((e) => {
      return dockerAPIToContainerDesc(e);
    });
    await Promise.all(
      services
        .filter((s) => s.state === 'RUNNING')
        .map(async (s) => {
          s.state = (await isReady(s)) ? 'READY' : s.state;
        })
    );
    return services;
  } catch (err) {
    console.log(err);
  }
}
