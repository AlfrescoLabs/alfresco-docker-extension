import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  colors,
  Link,
  Stack,
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
  getAlfrescoImages,
} from './services';
import {
  canRun,
  canStop,
  isLoading,
  isStopping,
  isError,
  isReady,
  needSetup,
  isInstalling,
} from './queryState';
import {
  setup,
  runContainers,
  stopContainers,
  openAlfrescoInBrowser,
} from '../helper/cli';
import {
  ALFRESCO_25_1_CONFIGURATION,
} from './configuration';
import { CloudDownloadSharp, OpenInBrowser } from '@mui/icons-material';

function commands(alfresco: ServiceStore, dispatch) {
  return {
    run: () => {
      runContainers(alfresco.exposePorts, alfresco.configuration);
      dispatch({ type: 'START_ALFRESCO' });
    },
    stop: () => {
      stopContainers(alfresco.configuration);
      dispatch({ type: 'STOP_ALFRESCO' });
    },
    setup: () => {
      setup(alfresco.configuration);
      dispatch({ type: 'DOWNLOAD_IMAGES' });
    },
  };
}

const CommandPanel = ({ alfrescoState, commands }) => {
  return (
    <React.Fragment>
      <Stack direction="row" spacing={2}>
        <Button
          disabled={!needSetup(alfrescoState)}
          variant="contained"
          onClick={(e) => {
            e.preventDefault();
            commands.setup();
          }}
          startIcon={<CloudDownloadSharp />}
        >
          Setup
        </Button>
        <Button
          disabled={!canRun(alfrescoState)}
          variant="contained"
          onClick={(e) => {
            e.preventDefault();
            commands.run();
          }}
          startIcon={<PlayIcon />}
        >
          Run
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
          Stop
        </Button>
        {isReady(alfrescoState) ? (
          <Link
            onClick={(e) => {
              e.preventDefault();
              openAlfrescoInBrowser();
            }}
            href="#"
            variant="h3"
          >
            Open in browser
            <OpenInBrowser />
          </Link>
        ) : (
          ''
        )}
      </Stack>
    </React.Fragment>
  );
};

const FeedbackPanel = ({ alfrescoState }) => {
  let message: string = '';
  let actionInProgress: boolean = false;

  if (isInstalling(alfrescoState)) {
    message = 'Pulling images, it may take few minutes... ';
    actionInProgress = true;
  }
  if (isLoading(alfrescoState)) {
    message = 'Starting Alfresco containers...';
    actionInProgress = true;
  }
  if (isStopping(alfrescoState)) {
    message = 'Stopping Alfresco containers...';
    actionInProgress = true;
  }
  if (isReady(alfrescoState)) {
    message =
      "Alfresco is Ready! Click the 'Open in browser' link and use the default credentials admin/admin";
    actionInProgress = false;
  }
  return (
    <Box
      sx={{
        textAlign: 'justify',
        fontSize: '1.1em',
      }}
    >
      {actionInProgress ? (
        <span
          style={{
            marginLeft: '1rem',
            marginRight: '1rem',
          }}
        >
          <CircularProgress
            sx={{
              verticalAlign: 'middle',
              color: colors.blue[500],
            }}
          />
        </span>
      ) : (
        ''
      )}
      <span
        style={{
          verticalAlign: 'middle',
          lineHeight: 'normal',
        }}
      >
        {message}
      </span>
    </Box>
  );
};

const PortsPanel = ({ alfresco, alfrescoState }) => {
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);

  const handleToggleCheckbox = () => {
    setIsCheckboxChecked(!isCheckboxChecked);
    alfresco.exposePorts=!isCheckboxChecked;
  };

  return (
    <React.Fragment>
      <Stack direction="row" alignItems="center" spacing={2}>
        <input
          type="checkbox"
          checked={isCheckboxChecked}
          onClick={handleToggleCheckbox}
          disabled={canStop(alfrescoState)}
        />
        <label>Expose container ports to your host</label>
      </Stack>
    </React.Fragment>
  );
}

export const DockerContainerCreate = ({ dockerInfo }) => {
  const [configuration] = useState(
    ALFRESCO_25_1_CONFIGURATION
  );
  const [alfresco, dispatch] = useReducer<Reducer<ServiceStore, Action>>(
    serviceReducer,
    defaultAlfrescoState(configuration)
  );
  const refreshContainers = async () => {
    let result = await getAlfrescoServices(configuration);
    dispatch({ type: 'REFRESH_SERVICE_STATE', payload: result });
  };
  const refreshImages = async () => {
    let result = await getAlfrescoImages(configuration);
    dispatch({ type: 'REFRESH_IMAGE_STATE', payload: result });
  };
  // run refresh containers on load
  useEffect(() => {
    refreshImages();
    refreshContainers();
  }, []);

  // refresh every 1.5 secs to check state
  useEffect(() => {
    let imageChecker;
    let timer;
    if (alfresco.alfrescoState !== AlfrescoStates.NOT_ACTIVE) {
      if (isInstalling(alfresco.alfrescoState)) {
        imageChecker = setTimeout(refreshImages, 1500);
      } else {
        timer = setTimeout(refreshContainers, 1500);
      }
    }

    return () => {
      clearTimeout(timer);
      clearTimeout(imageChecker);
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
      <PortsPanel alfresco={alfresco} alfrescoState={alfresco.alfrescoState} />
      <DockerContainerList alfresco={alfresco} />
    </React.Fragment>
  );
};
