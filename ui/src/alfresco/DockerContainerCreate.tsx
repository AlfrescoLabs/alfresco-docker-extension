import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  colors,
  Stack,
  Typography,
} from '@mui/material';

import PlayIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import React, { useEffect, useReducer, Reducer, useState } from 'react';
import { DockerContainerList } from './DockerContainerList';
import { ServiceStore, Action, AlfrescoStates } from './types';
import { resources } from '../helper/resources';
import {
  serviceReducer,
  defaultAlfrescoState,
  getAlfrescoServices,
} from './services';
import {
  canRun,
  isRunning,
  canStop,
  isLoading,
  isStopping,
  isError,
} from './queryState';
import { runContainers, stopContainers } from '../helper/cli';
import {
  ALFRESCO_7_3_CONFIGURATION,
  ALFRESCO_7_2_CONFIGURATION,
} from './configuration';

function commands(alfresco: ServiceStore, dispatch) {
  return {
    run: () => {
      runContainers(alfresco.configuration);
      dispatch({ type: 'START_ALFRESCO' });
    },
    stop: () => {
      stopContainers(alfresco.configuration);
      dispatch({ type: 'STOP_ALFRESCO' });
    },
  };
}

const CommandPanel = ({ alfrescoState, commands }) => {
  return (
    <React.Fragment>
      <Stack direction="row" spacing={2}>
        <Button
          disabled={!canRun(alfrescoState)}
          variant="contained"
          onClick={(e) => {
            e.preventDefault();
            commands.run();
          }}
          startIcon={<PlayIcon />}
        >
          {!isRunning(alfrescoState) ? 'Run' : 'Running...'}
        </Button>
        <Button
          disabled={!canStop(alfrescoState)}
          variant="contained"
          onClick={(e) => {
            e.preventDefault();
            commands.stop();
          }}
          startIcon={<StopIcon />}
        >
          {alfrescoState !== AlfrescoStates.STOPPING ? 'Stop' : 'Stopping...'}
        </Button>
      </Stack>
    </React.Fragment>
  );
};

const FeedbackPanel = ({ alfrescoState }) => {
  if (isLoading(alfrescoState) || isStopping(alfrescoState))
    return (
      <Box
        sx={{
          marginBottom: '15px',
          textAlign: 'center',
        }}
      >
        <Typography>{alfrescoState}</Typography>
        <CircularProgress
          size={30}
          sx={{
            color: colors.blue[500],
          }}
        />
      </Box>
    );
  return <></>;
};

export const DockerContainerCreate = () => {
  const [configuration, setConfiguration] = useState(
    ALFRESCO_7_3_CONFIGURATION
  );
  const [alfresco, dispatch] = useReducer<Reducer<ServiceStore, Action>>(
    serviceReducer,
    defaultAlfrescoState(configuration)
  );

  const refreshContainers = async () => {
    let result = await getAlfrescoServices(configuration);
    dispatch({ type: 'REFRESH_SERVICE_STATE', payload: result });
  };

  // run refresh containers on load
  useEffect(() => {
    refreshContainers();
  }, []);

  // refresh every 1.5 secs to check state
  useEffect(() => {
    let timer = setTimeout(refreshContainers, 1500);
    if (alfresco.alfrescoState === AlfrescoStates.NOT_ACTIVE)
      clearTimeout(timer);
    return () => {
      clearTimeout(timer);
    };
  }, [alfresco]);

  let errorComponent: {};
  if (isError(alfresco.alfrescoState)) {
    errorComponent = (
      <Box>
        <Alert severity="error">
          <AlertTitle>{resources.CREATE.ERROR}</AlertTitle>
          {alfresco.errors}
        </Alert>
      </Box>
    );
  }

  return (
    <React.Fragment>
      {errorComponent}
      <CommandPanel
        alfrescoState={alfresco.alfrescoState}
        commands={commands(alfresco, dispatch)}
      />
      <FeedbackPanel alfrescoState={alfresco.alfrescoState} />
      <DockerContainerList alfresco={alfresco} />
    </React.Fragment>
  );
};
