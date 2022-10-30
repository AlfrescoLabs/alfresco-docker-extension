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
import React, { useEffect } from 'react';
import {
  openAlfrescoInBrowser,
  readyActiveMq,
  readyDb,
  readyRepo,
  readySolr,
  readyTransform,
  viewContainer,
  alfrescoContainers,
} from '../helper/cli';
import { resources } from '../helper/resources';

const startAlfresco = async () => {
  await openAlfrescoInBrowser();
};
export interface ServiceDescriptor {
  id: string;
  name: string;
  state: string;
  status: string;
  image: string;
  imageName: string;
  version: string;
}

async function getRows() {
  let errors = [];
  let rows = [];

  function ifReturn200(restCall) {
    return async () => {
      let status: string = await restCall();
      return status === '200';
    };
  }
  function includeRows(restCall) {
    return async () => {
      let status: string = await restCall();
      return status.includes('rows');
    };
  }
  const readyCheckPolicies = {
    postgres: includeRows(readyDb),
    alfresco: ifReturn200(readyRepo),
    'transform-core-aio': ifReturn200(readyTransform),
    solr6: ifReturn200(readySolr),
    activemq: ifReturn200(readyActiveMq),
  };
  async function checkServiceStatus(service: ServiceDescriptor) {
    let readyFn = readyCheckPolicies[service.name];
    if (readyFn) {
      let isR = await readyFn();
      return isR ? 'READY' : service.state.toUpperCase();
    }
    return 'UNKNOWN POLICY FOR' + service.name;
  }

  try {
    const result = await alfrescoContainers();
    for (let i = 0; i < result.length; i++) {
      if (result[i].state === 'exited') {
        errors.push(resources.LIST.ALFRESCO_CONTAINERS_LIST_ERROR);
      } else {
        result[i].state = await checkServiceStatus(result[i]);
      }
      rows.push(result[i]);
    }
  } catch (err) {
    console.log(err);
    // TODO do be managed differently
  }

  return { rows, errors };
}

export const DockerContainerList = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isReady, setIsReady] = React.useState(false);
  const [isError, setIsError] = React.useState('');
  const [rows, setRows] = React.useState([]);

  useEffect(() => {
    let unmounted = false;
    setIsLoading(true);
    const loadContainers = async () => {
      let result = await getRows();
      if (!unmounted) {
        setIsReady(
          result.rows.length === 5 &&
            result.rows.every((c) => c.state === 'READY')
        );
        if (result.errors.length > 0) {
          setIsError(result.errors[0]);
        }
        setRows(result.rows);
        //setIsLoading(false);
      }
    };

    if (rows.length === 0) loadContainers();

    let timer;
    if (!isReady) {
      timer = setTimeout(loadContainers, 1500);
    } else {
      clearTimeout(timer);
    }
    return () => {
      unmounted = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  function colorForState(state) {
    if (state === 'READY') return 'success';
    if (state === 'EXITED') return 'error';
    return 'warning';
  }
  let statusComponent: {};
  let errorComponent: {};
  if (isError) {
    errorComponent = (
      <Box>
        <Alert severity="error">
          <AlertTitle>ERROR</AlertTitle>
          {isError}
        </Alert>
      </Box>
    );
  } else if (isReady) {
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
          {rows.map((row) => (
            <TableRow
              key={row.image}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {row.image}
              </TableCell>
              <TableCell>{row.version}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell align="center">
                <Chip
                  label={row.state}
                  color={colorForState(row.state)}
                  variant="filled"
                  size="small"
                />
              </TableCell>
              <TableCell align="right">
                <Button
                  onClick={() => {
                    viewContainer(row.id);
                  }}
                >
                  {row.state === 'EXITED' && (
                    <ErrorIcon style={{ color: 'red' }} />
                  )}
                  {row.state !== 'EXITED' && <InfoIcon />}
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
