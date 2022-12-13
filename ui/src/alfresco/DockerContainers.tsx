import { Box, Stack, Alert, AlertTitle } from '@mui/material';
import { useEffect, useState } from 'react';
import { DockerContainerCreate } from './DockerContainerCreate';
import { getDockerInfo } from '../helper/cli';
import { resources } from '../helper/resources';
import { RAM_LIMIT } from './configuration';

const enoughRAM = (dockerInfo: DockerInfo) => dockerInfo.RAM >= RAM_LIMIT;

const preconditions = [
  {
    cond: enoughRAM,
    title: resources.HOME.TITLE,
    message: (info) => (
      <div>
        {resources.HOME.RAM_ALERT_MESSAGE} <br />{' '}
        {resources.HOME.RAM_AVAILABLE_MESSAGE + info.RAM.toFixed(2)}
      </div>
    ),
  }
];
export type DockerInfo = {
  RAM: number;
  arch: 'none' | 'x86_64' | 'aarch64';
};
export const DockerContainers = () => {
  const [dockerInfo, setDockerInfo] = useState<DockerInfo>({
    RAM: RAM_LIMIT,
    arch: 'none',
  });

  async function readDockerInfo() {
    let info = await getDockerInfo();
    setDockerInfo({
      RAM: info?.MemTotal / 1024 / 1024 / 1024,
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
      { dockerInfo.arch != 'none' && <DockerContainerCreate dockerInfo={dockerInfo}/> }
    </Stack>
  );
};
