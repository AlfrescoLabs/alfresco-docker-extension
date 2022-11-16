import { AlfrescoState, AlfrescoStates } from './types';

export const canRun = (state: AlfrescoState) =>
  state === AlfrescoStates.NOT_ACTIVE;
export const canStop = (state: AlfrescoState) =>
  state !== AlfrescoStates.NOT_ACTIVE && state !== AlfrescoStates.STOPPING;
export const isLoading = (state: AlfrescoState) =>
  state === AlfrescoStates.STARTING;
export const isRunning = (state: AlfrescoState) =>
  state === AlfrescoStates.STARTING || state === AlfrescoStates.UP_AND_RUNNING;
export const isReady = (state: AlfrescoState) =>
  state === AlfrescoStates.UP_AND_RUNNING;
export const isStopping = (state: AlfrescoState) =>
  state === AlfrescoStates.STOPPING;
export const isError = (state: AlfrescoState) => state === AlfrescoStates.ERROR;
