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
import { viewContainer, openAlfrescoInBrowser } from '../helper/cli';
import { resources } from '../helper/resources';

import { ContainerState } from '../helper/constants';
import React from 'react';
import { AlfrescoStates, ServiceStore } from './alfrescoServices';

const startAlfresco = async () => {
  await openAlfrescoInBrowser();
};

const ContainerStatus = ({ containerState }) => {
  switch (containerState as ContainerState) {
    case 'NO_CONTAINER':
      return (
        <Chip
          label={containerState}
          color="info"
          variant="outlined"
          size="small"
        />
      );
    case 'RUNNING':
      return (
        <Chip
          label={containerState}
          color="warning"
          variant="filled"
          size="small"
        />
      );
    case 'READY':
      return (
        <Chip
          label={containerState}
          color="success"
          variant="filled"
          size="small"
        />
      );
    case 'EXITED':
      return (
        <Chip
          label={containerState}
          color="error"
          variant="filled"
          size="small"
        />
      );
  }
  return (
    <Chip label={containerState} color="info" variant="filled" size="small" />
  );
};

export const DockerContainerList = ({
  alfresco,
}: {
  alfresco: ServiceStore;
}) => {
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
                <ContainerStatus containerState={s.state} />
              </TableCell>
              <TableCell align="right">
                {s.state === 'NO_CONTAINER' ? (
                  <InfoIcon style={{ color: 'gray' }} />
                ) : (
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      viewContainer(s.id);
                    }}
                  >
                    {s.state === 'EXITED' && (
                      <ErrorIcon style={{ color: 'red' }} />
                    )}
                    {s.state !== 'EXITED' && <InfoIcon />}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {alfresco.alfrescoState === AlfrescoStates.UP_AND_RUNNING ? (
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
      ) : (
        <br></br>
      )}
    </React.Fragment>
  );
};
