import { Box, Stack, Alert, AlertTitle, colors } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { DockerContainerCreate } from './DockerContainerCreate';
import { getDockerInfo } from '../helper/cli';
import { resources } from '../helper/resources';
import { RAM_LIMIT } from '../helper/constants';

const enoughRAM = (dockerInfo) => dockerInfo.RAM >= RAM_LIMIT;
const rightArch = (dockerInfo) => dockerInfo.arch === 'x86_64';

const preconditions = [
  {
    cond: enoughRAM,
    title: resources.HOME.TITLE,
    message: (info) => (
      <div>
        {resources.HOME.RAM_ALERT_MESSAGE} <br />{' '}
        {resources.HOME.RAM_AVAILABLE_MESSAGE + info.RAM}
      </div>
    ),
  },
  {
    cond: rightArch,
    title: 'Docker Desktop Architecture not supported!',
    message: (info) =>
      'Architecture ' + info.arch + ' is not supported by this extension!',
  },
];

export const DockerContainers = () => {
  const [dockerInfo, setDockerInfo] = useState({
    RAM: RAM_LIMIT.toString(),
    arch: 'x86_64',
  });

  async function readDockerInfo() {
    let info = await getDockerInfo();

    setDockerInfo({
      RAM: (info?.MemTotal / 1024 / 1024 / 1024).toFixed(2),
      arch: info?.Architecture,
    });
  }

  useEffect(() => {
    readDockerInfo();
  }, []);

  return (
    <Stack direction="column" spacing={2}>
      <Box>{resources.HOME.TITLE}</Box>

      {preconditions
        .filter((p) => p.cond(dockerInfo) === false)
        .map((fp) => (
          <Box>
            <Alert severity="error">
              <AlertTitle>{fp.title}</AlertTitle>
              {fp.message(dockerInfo)}
            </Alert>
          </Box>
        ))}
      {dockerInfo.arch === 'x86_64' && <DockerContainerCreate />}
    </Stack>
  );
};
