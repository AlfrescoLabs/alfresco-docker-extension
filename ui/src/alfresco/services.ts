import { listAllContainers, listAllImages } from '../helper/cli';
import {
  AlfrescoStates,
  Service,
  ServiceStore,
  Action,
  ContainerState,
  ServiceConfiguration,
  ImageInfo,
} from './types';
import { isReady } from './checkServiceReadiness';

function emptyServiceDescFor(name: string, image: string): Service {
  let [imageName, version] = image.split(':');
  return {
    id: '',
    name: name,
    port: '',
    state: 'NO_CONTAINER',
    status: '',
    image: image,
    imageName,
    imageState: 'NOT_AVAILABLE',
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
    exposePorts: false,
  };
}

function updateContainers(data: Service[], state: ServiceStore): ServiceStore {
  for (let curr of state.services) {
    let contState: ContainerState = 'NO_CONTAINER';

    for (let container of data) {
      if (curr.name === container.name) {
        curr.id = container.id;
        contState = container.state;
        curr.state = container.state;
        curr.status = container.status;
        curr.port = container.port;
        break;
      }
    }
    curr.state = contState;
  }
  return state;
}
function updateImages(data: ImageInfo[], state: ServiceStore): ServiceStore {
  for (let curr of state.services) {
    curr.imageState = 'NOT_AVAILABLE';

    for (let img of data) {
      if (img.name === curr.image) {
        curr.imageState = img.state;
        break;
      }
    }
  }

  return state;
}

function updateAlfrescoAppState(store: ServiceStore) {
  if (store.services.every((c) => c.state === 'READY')) {
    store.alfrescoState = AlfrescoStates.UP_AND_RUNNING;
    return store;
  }
  if (store.alfrescoState === AlfrescoStates.STOPPING) {
    if (store.services.every((c) => c.state === 'NO_CONTAINER')) {
      store.alfrescoState = AlfrescoStates.INSTALLED;
      store.services.map((service) => service.port = '');
      return store;
    }
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
      store.services.some((c) => c.state === 'DEAD' || c.state === 'EXITED')
    ) {
      store.alfrescoState = AlfrescoStates.ERROR;
      return store;
    }
  }
  return store;
}
function checkIfAllImagesAreLocallyAvailable(
  store: ServiceStore
): ServiceStore {
  if (store.services.every((s) => s.imageState === 'DOWNLOADED'))
    store.alfrescoState = 'INSTALLED';
  return store;
}
export function serviceReducer(
  state: ServiceStore,
  action: Action
): ServiceStore {
  let newState: ServiceStore = { ...state, errors: [] };
  switch (action.type) {
    case 'REFRESH_SERVICE_STATE': {
      return updateAlfrescoAppState(updateContainers(action.payload, newState));
    }
    case 'REFRESH_IMAGE_STATE': {
      return checkIfAllImagesAreLocallyAvailable(
        updateImages(action.payload, newState)
      );
    }
    case 'START_ALFRESCO': {
      newState.alfrescoState = AlfrescoStates.STARTING;
      return newState;
    }
    case 'STOP_ALFRESCO': {
      newState.alfrescoState = AlfrescoStates.STOPPING;
      return newState;
    }
    case 'DOWNLOAD_IMAGES': {
      newState.alfrescoState = AlfrescoStates.INSTALLING;
      return newState;
    }
  }
  return state;
}

function dockerAPIToContainerDesc(dockerAPIContainer): Service {
  const [imageName, imageTag] = dockerAPIContainer.Image.split(':');
  return {
    name: dockerAPIContainer.Names[0].substring(1),
    port: dockerAPIContainer.Port,
    state: dockerAPIContainer.State.toUpperCase(),
    status: dockerAPIContainer.Status,
    image: dockerAPIContainer.Image,
    imageName,
    imageState: 'DOWNLOADED',
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
export async function getAlfrescoImages(
  serviceConf: ServiceConfiguration[]
): Promise<ImageInfo[]> {
  try {
    const imageList = await listAllImages(serviceConf);
    const images: ImageInfo[] = imageList.map((i) => {
      return { name: i.RepoTags[0], state: 'DOWNLOADED', port: '' };
    });
    return images;
  } catch (err) {
    console.log(err);
  }
}
