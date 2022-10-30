import { ResetTvOutlined } from '@mui/icons-material';
import { stat } from 'fs';
import { start } from 'repl';
import {
  readyActiveMq,
  readyDb,
  readyRepo,
  readySolr,
  readyTransform,
  alfrescoContainers,
} from '../helper/cli';
import {
  ACTIVEMQ_IMAGE_TAG,
  POSTGRES_IMAGE_TAG,
  REPO_IMAGE_TAG,
  SOLR_IMAGE_TAG,
  TRANSFORM_IMAGE_TAG,
  ServiceDescriptor,
  ServiceStore,
  AlfState,
  ContainerState,
} from '../helper/constants';

function emptyServiceDescFor(name: string, image: string): ServiceDescriptor {
  let [imageName, version] = image.split(':');
  return {
    id: '',
    name: name,
    state: 'INACTIVE',
    status: '',
    image: image,
    imageName,
    version,
  };
}

export const actions = ['RUN_SERVICES', 'STOP_SERVICES'];

export function defaultAlfrescoState(): ServiceStore {
  return {
    alfState: 'IDLE',
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

function updateStateWith(state: ServiceStore, data: ServiceDescriptor[]) {
  for (let curr of state.services) {
    for (let s of data) {
      let isPresent = false;
      if (curr.name === s.name) {
        curr.state = s.state;
        curr.status = s.status;
        isPresent = true;
        break;
      }
      if (!isPresent) curr.state = 'INACTIVE';
    }
  }
}

function updateAlfrescoAppState(state: ServiceStore) {
  if (state.services.every((c) => c.state === 'READY')) {
    state.alfState = 'READY';
    return;
  }

  if (state.services.every((c) => c.state === 'INACTIVE')) {
    state.alfState = 'IDLE';
    return;
  }

  if (
    state.services.some(
      (c) =>
        c.state === 'DEAD' || c.state === 'EXITED' || c.state === 'INACTIVE'
    )
  ) {
    state.alfState = 'ERROR';
    return;
  }
}

export function serviceReducer(state, action): ServiceStore {
  console.log(action);
  let newState: ServiceStore = { ...state };
  switch (action.type) {
    case 'UPDATE_SERVICE_STATE': {
      updateStateWith(newState, action.data);
      updateAlfrescoAppState(newState);
      return newState;
    }
  }
  return defaultAlfrescoState();
}

function ifReturn200(restCall) {
  return async () => {
    let status: string = await restCall();
    return status === '200';
  };
}
function includeRows(restCall) {
  return async () => {
    let status: string = await restCall();
    return status.includes('rows');
  };
}

const readyCheckPolicies = {
  postgres: includeRows(readyDb),
  alfresco: ifReturn200(readyRepo),
  'transform-core-aio': ifReturn200(readyTransform),
  solr6: ifReturn200(readySolr),
  activemq: ifReturn200(readyActiveMq),
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
      services[i].state = await checkServiceStatus(services[i]);
    }
    return services;
  } catch (err) {
    console.log(err);
    // TODO do be managed differently
  }
  return services;
}
