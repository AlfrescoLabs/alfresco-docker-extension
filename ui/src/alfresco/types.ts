export type ServiceName =
  | 'activemq'
  | 'solr6'
  | 'transform-core-aio'
  | 'postgres'
  | 'alfresco'
  | 'proxy'
  | 'content-app';

export type ServiceConfiguration = {
  service: ServiceName;
  image: string;
  run: { options: string[]; cmd: string; order: number };
};
export type ImageState =
  | 'NOT_AVAILABLE'
  | 'DOWNLOADED'
  | 'DOWNLOADING'
  | 'ERROR';

export type ImageInfo = {
  name: string;
  state: ImageState;
};
export interface Service {
  id: string;
  name: string;
  state: ContainerState;
  status: string;
  image: string;
  imageName: string;
  imageState: ImageState;
  version: string;
}
// NOT_ACTIVE -> STARTING (ALL IMAGES ARE LOCALLY AVAILABLE)
// NOT_ACTIVE -> INSTALLING -> INSTALLED -> STARTING
export const AlfrescoStates = Object.freeze({
  NOT_ACTIVE: 'NOT_ACTIVE',
  INSTALLING: 'INSTALLING',
  INSTALLED: 'INSTALLED',
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
  configuration: ServiceConfiguration[];
  services: Service[];
  errors: string[];
}
export type Action = {
  type: string;
  payload?: any;
  error?: string;
};
export type DockerInfo = {
  RAM: number;
  arch: 'none' | 'x86_64' | 'aarch64';
};
