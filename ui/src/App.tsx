import CssBaseline from '@mui/material/CssBaseline';
import { DockerMuiThemeProvider } from '@docker/docker-mui-theme';
import LogoDark from './images/alfresco-white-horizontal.png';
import LogoLight from './images/alfresco-black-horizontal.png';
import { Box, Stack } from '@mui/material';
import { DockerContainers } from './alfresco/DockerContainers';
import React, { useEffect, useState } from 'react';

export const App = () => {
  const [mode, setMode] = useState('light')
  const onSelectMode = (mode) => {
    setMode(mode)
    if (mode === 'dark')
      document.body.classList.add('dark-mode')
    else
      document.body.classList.remove('dark-mode')
  }  
  useEffect(() => {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => onSelectMode(e.matches ? 'dark' : 'light'));
    onSelectMode(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    return () => {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', () => {
      });
    }
  }, []);
  return (
    <DockerMuiThemeProvider>
      <CssBaseline />
      <Stack direction="column" spacing={2}>
        <Box
          component="img"
          sx={{
            alignSelf: 'right',
            marginTop: '30px',
            marginBottom: '10px',
            maxHeight: { xs: 400, md: 600 },
            maxWidth: { xs: 400, md: 600 },
          }}
          src={mode === 'dark' ? LogoDark : LogoLight}
        />
      </Stack>
      <DockerContainers />
    </DockerMuiThemeProvider>
  );
};
