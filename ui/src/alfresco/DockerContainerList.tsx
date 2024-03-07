import {
  Button,
  Chip,
  colors,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import ErrorIcon from '@mui/icons-material/Error';
import { viewContainer } from '../helper/cli';
import { resources } from '../helper/resources';

import React from 'react';
import { ServiceStore, ContainerState } from './types';
import { CloudDone, CloudOff } from '@mui/icons-material';

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
            >
              <TableCell scope="row">
                {s.imageState === 'NOT_AVAILABLE' ? (
                  <Tooltip title="Image not available, click 'Setup' button">
                    <CloudOff
                      style={{
                        verticalAlign: 'middle',
                        marginRight: '16px',
                        color: colors.amber[500],
                      }}
                    ></CloudOff>
                  </Tooltip>
                ) : (
                  <Tooltip title="Image available locally">
                    <CloudDone
                      style={{
                        verticalAlign: 'middle',
                        marginRight: '16px',
                        color: colors.green[400],
                      }}
                    ></CloudDone>
                  </Tooltip>
                )}
                <span>{s.imageName}</span>
              </TableCell>
              <TableCell>{s.version}</TableCell>
              <TableCell>{s.name}</TableCell>
              <TableCell align="center">
                <ContainerStatus containerState={s.state} />
              </TableCell>
              <TableCell align="right">
                {s.state === 'NO_CONTAINER' ? (
                  <Tooltip title="This option will be enabled when the Container is running">
                      <InfoIcon style={{ color: 'gray' }} />
                  </Tooltip>
                ) : (
                  <Tooltip title="View container details">
                    <Button
                      variant="text"
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
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </React.Fragment>
  );
};
