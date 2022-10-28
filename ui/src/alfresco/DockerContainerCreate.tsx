import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Stack,
} from '@mui/material';

import PlayIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RefreshIcon from '@mui/icons-material/Refresh';
import React, { useState, useEffect } from 'react';
import { DockerContainerList } from './DockerContainerList';
import { blueGrey } from '@mui/material/colors';
import {
  getContainersRunning,
  createNetwork,
  deployDb,
  deployMq,
  deployRepository,
  deployTransform,
  waitTillReadyDb,
  refreshData,
  stopContainers,
  deploySolr,
} from '../helper/cli';
import { resources } from '../helper/resources';

const runContainers = async () => {
  await createNetwork();
  await deployDb();
  await deployMq();
  await deployTransform();
  await deploySolr();

  await waitTillReadyDb();
  await deployRepository();
};

const clickStartButton = async (
  setStartButton: React.Dispatch<React.SetStateAction<any>>,
  setStartButtonDisable: React.Dispatch<React.SetStateAction<any>>,
  setIsError: React.Dispatch<React.SetStateAction<any>>
) => {
  setStartButtonDisable(true);
  setStartButton('Running...');
  let success = true;
  try {
    await runContainers();
  } catch (err) {
    success = false;
    setIsError(JSON.stringify(err));
  }
  if (success) {
    refreshData();
  } else {
    setStartButtonDisable(false);
    setStartButton('Run');
  }
};

const clickStopButton = async (
  setStopButton: React.Dispatch<React.SetStateAction<any>>,
  setStopButtonDisable: React.Dispatch<React.SetStateAction<any>>,
  setShowRefresh: React.Dispatch<React.SetStateAction<any>>,
  setIsError: React.Dispatch<React.SetStateAction<any>>
) => {
  setStopButtonDisable(true);
  setShowRefresh(false);
  setStopButton('Stopping...');
  let success = true;
  try {
    await stopContainers();
  } catch (err) {
    success = false;
    setIsError(JSON.stringify(err));
  }
  if (success) {
    refreshData();
  } else {
    setStopButtonDisable(false);
    setShowRefresh(true);
    setStopButton('Stop');
  }
};

export const DockerContainerCreate = () => {
  const [containers, setContainers] = useState('');
  const [startButton, setStartButton] = useState('Run');
  const [startButtonDisable, setStartButtonDisable] = useState(false);
  const [stopButton, setStopButton] = useState('Stop');
  const [stopButtonDisable, setStopButtonDisable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState('');
  const [showRefresh, setShowRefresh] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      let containers = await getContainersRunning();
      setContainers(containers);
      setIsLoading(false);
    })();
  }, []);

  let errorComponent: {};
  if (isError !== '') {
    errorComponent = (
      <Box>
        <Alert severity="error">
          <AlertTitle>{resources.CREATE.ERROR}</AlertTitle>
          {isError}
        </Alert>
      </Box>
    );
  }

  let component: {};
  if (isLoading) {
    component = (
      <Box
        sx={{
          marginBottom: '15px',
          textAlign: 'center',
        }}
      >
        <CircularProgress
          size={50}
          sx={{
            color: blueGrey[500],
          }}
        />
      </Box>
    );
  } else {
    if (containers.length > 1) {
      component = (
        <React.Fragment>
          <Stack direction="row" spacing={2}>
            <Button
              disabled={stopButtonDisable}
              variant="contained"
              onClick={() => {
                clickStopButton(
                  setStopButton,
                  setStopButtonDisable,
                  setShowRefresh,
                  setIsError
                );
              }}
              startIcon={<StopIcon />}
            >
              {stopButton}
            </Button>
            {showRefresh && (
              <Button
                variant="contained"
                onClick={() => {
                  refreshData();
                }}
                startIcon={<RefreshIcon />}
              >
                Refresh
              </Button>
            )}
          </Stack>
          <DockerContainerList />
        </React.Fragment>
      );
    } else {
      component = (
        <React.Fragment>
          <Stack direction="row" spacing={2}>
            <Button
              disabled={startButtonDisable}
              variant="contained"
              onClick={() => {
                clickStartButton(
                  setStartButton,
                  setStartButtonDisable,
                  setIsError
                );
              }}
              startIcon={<PlayIcon />}
            >
              {startButton}
            </Button>
          </Stack>
          <DockerContainerList />
        </React.Fragment>
      );
    }
  }

  return (
    <React.Fragment>
      {component}
      {errorComponent}
    </React.Fragment>
  );
};
