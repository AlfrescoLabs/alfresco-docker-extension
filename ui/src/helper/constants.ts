export const RAM_LIMIT = 10;

export const POSTGRES_IMAGE_TAG = 'postgres:13.3';
export const ACTIVEMQ_IMAGE_TAG =
  'alfresco/alfresco-activemq:5.16.4-jre11-centos7';
export const TRANSFORM_IMAGE_TAG = 'alfresco/alfresco-transform-core-aio:2.5.7';
export const REPO_IMAGE_TAG =
  'alfresco/alfresco-content-repository-community:7.2.0';
export const SOLR_IMAGE_TAG = 'alfresco/alfresco-search-services:2.0.3';
export const ACA_IMAGE_TAG = 'alfresco/alfresco-content-app:2.9.0';
export const PROXY_IMAGE_TAG = 'alfresco/alfresco-acs-nginx:3.4.2';

export interface ServiceDescriptor {
  id: string;
  name: string;
  state: ContainerState;
  status: string;
  image: string;
  imageName: string;
  version: string;
}
export const alfrescoServices = [
  'alfresco',
  'solr6',
  'transform-core-aio',
  'activemq',
  'postgres',
  'content-app',
  'proxy'
];

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
