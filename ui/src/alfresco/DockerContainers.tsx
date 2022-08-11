import { Box, Stack, Alert, AlertTitle } from "@mui/material";
import React, {useEffect} from "react";
import { DockerContainerCreate } from "./DockerContainerCreate";
import { getRamAvailable } from "../helper/cli"
import { resources } from '../helper/resources'
import { RAM_LIMIT } from '../helper/constants'

export const DockerContainers = () => {

    const [ram, setRam] = React.useState(undefined)
    useEffect(() => {
      (async () => {
          let ram = await getRamAvailable()
          setRam(ram)
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

    return <Stack direction="column" spacing={2}>
      <Box>
          {resources.HOME.TITLE}
      </Box>
      {ramComponent}
      <React.Fragment>
          <DockerContainerCreate />
      </React.Fragment>
    </Stack>
}