import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import ErrorIcon from '@mui/icons-material/Error';
import React, { useEffect, useReducer } from 'react';
import { viewContainer, openAlfrescoInBrowser } from '../helper/cli';
import { resources } from '../helper/resources';
import {
  serviceReducer,
  defaultAlfrescoState,
  getAlfrescoServices,
} from './alfrescoServices';
import { ContainerState } from '../helper/constants';

const startAlfresco = async () => {
  await openAlfrescoInBrowser();
};

function colorForState(state: ContainerState) {
  if (state === 'READY') return 'success';
  if (state === 'EXITED') return 'error';
  if (state === 'INACTIVE') return 'secondary';
  return 'warning';
}

export const DockerContainerList = (props) => {
  const [alfresco, dispatch] = useReducer(
    serviceReducer,
    defaultAlfrescoState()
  );

  useEffect(() => {
    let unmounted = false;
    const refreshContainers = async () => {
      let result = await getAlfrescoServices();
      console.log('refresh config');
      console.log(alfresco.alfState);
      if (!unmounted) {
        dispatch({ type: 'UPDATE_SERVICE_STATE', data: result });
      }
    };
    let timer;
    timer = setTimeout(refreshContainers, 1500);
    if (alfresco.alfState === 'IDLE') clearTimeout(timer);
    return () => {
      unmounted = true;
      clearTimeout(timer);
    };
  }, [alfresco]);

  let statusComponent: {};
  let errorComponent: {};
  if (alfresco.alfState === 'ERROR') {
    errorComponent = (
      <Box>
        <Alert severity="error">
          <AlertTitle>ERROR</AlertTitle>
          {alfresco.errors}
        </Alert>
      </Box>
    );
  } else if (alfresco.alfState === 'READY') {
    statusComponent = (
      <React.Fragment>
        <Stack direction="row" spacing={2}>
          <Box>
            <Alert severity="success">
              <AlertTitle>{resources.LIST.ALFRESCO_READY_TITLE}</AlertTitle>
              {resources.LIST.ALFRESCO_READY_MESSAGE}
            </Alert>
          </Box>
          <Button
            variant="contained"
            onClick={() => {
              startAlfresco();
            }}
          >
            {resources.LIST.START}
          </Button>
        </Stack>
      </React.Fragment>
    );
  }
  return (
    <React.Fragment>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <b>{resources.LIST.IMAGE}</b>
            </TableCell>
            <TableCell>
              <b>{resources.LIST.VERSION}</b>
            </TableCell>
            <TableCell>
              <b>{resources.LIST.NAME}</b>
            </TableCell>
            <TableCell align="center">
              <b>{resources.LIST.STATUS}</b>
            </TableCell>
            <TableCell align="center">
              <b>{resources.LIST.DETAILS}</b>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {alfresco.services.map((s) => (
            <TableRow
              key={s.image}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {s.image}
              </TableCell>
              <TableCell>{s.version}</TableCell>
              <TableCell>{s.name}</TableCell>
              <TableCell align="center">
                <Chip
                  label={s.state}
                  color={colorForState(s.state)}
                  variant="filled"
                  size="small"
                />
              </TableCell>
              <TableCell align="right">
                <Button
                  onClick={() => {
                    viewContainer(s.id);
                  }}
                >
                  {s.state === 'EXITED' && (
                    <ErrorIcon style={{ color: 'red' }} />
                  )}
                  {s.state !== 'EXITED' && <InfoIcon />}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {statusComponent}
      {errorComponent}
    </React.Fragment>
  );
};
