import { Box, Stack, Alert, AlertTitle } from "@mui/material";
import React, {useEffect} from "react";
import { DockerContainerCreate } from "./DockerContainerCreate";
import { getDockerInfo } from "../helper/cli"
import { resources } from '../helper/resources'
import { RAM_LIMIT } from '../helper/constants'

export const DockerContainers = () => {

    const [ram, setRam] = React.useState(undefined)
    const [architecture, setArchitecture] = React.useState('x86_64')
    useEffect(() => {
      (async () => {
          let info = await getDockerInfo()
          let ram = ((info?.MemTotal)/1024/1024/1024).toFixed(2)
          setRam(ram)
          let architecture = info?.Architecture
          setArchitecture(architecture)
      })()
    }, [])

    let ramComponent: {}
    if (ram < RAM_LIMIT) {
      ramComponent =
        <Box>
            <Alert severity="error">
                <AlertTitle>{resources.HOME.RAM_ALERT_TITLE}</AlertTitle>
                {resources.HOME.RAM_ALERT_MESSAGE}<br/>
                {resources.HOME.RAM_AVAILABLE_MESSAGE}{ram}
            </Alert>
        </Box>
    }

    let archComponent: {}
    if (architecture !== 'x86_64') {
      archComponent = 
        <Box>
            <Alert severity="error">
            <AlertTitle>Docker Desktop Architecture not supported!</AlertTitle>
            Architecture {architecture} is not supported by this extension!
            </Alert>
        </Box>
    }

    return <Stack direction="column" spacing={2}>
      <Box>
          {resources.HOME.TITLE}
      </Box>
      {ramComponent}
      {archComponent}
      <React.Fragment>
          {architecture === 'x86_64' && <DockerContainerCreate/>}
      </React.Fragment>
    </Stack>
}