import { AlfrescoState, AlfrescoStates } from './types';
export const needSetup = (state: AlfrescoState) =>
  state === AlfrescoStates.NOT_ACTIVE;
export const canRun = (state: AlfrescoState) =>
  state === AlfrescoStates.INSTALLED;
export const canStop = (state: AlfrescoState) => isRunning(state);
export const isInstalling = (state: AlfrescoState) =>
  state === AlfrescoStates.INSTALLING;
export const isLoading = (state: AlfrescoState) =>
  state === AlfrescoStates.STARTING;
export const isRunning = (state: AlfrescoState) =>
  state === AlfrescoStates.STARTING || state === AlfrescoStates.UP_AND_RUNNING;
export const isReady = (state: AlfrescoState) =>
  state === AlfrescoStates.UP_AND_RUNNING;
export const isStopping = (state: AlfrescoState) =>
  state === AlfrescoStates.STOPPING;
export const isError = (state: AlfrescoState) => state === AlfrescoStates.ERROR;
