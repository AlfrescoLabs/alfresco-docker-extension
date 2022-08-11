import CssBaseline from "@mui/material/CssBaseline";
import { DockerMuiThemeProvider } from "@docker/docker-mui-theme";
import Logo from "./images/alfresco-white-horizontal.png";
import { Box, Stack } from "@mui/material";
import { DockerContainers } from "./alfresco/DockerContainers";

export const App = () => {

  return (<DockerMuiThemeProvider>
        <CssBaseline/>
        <Stack direction="column" spacing={2}>
            <Box
                component="img"
                sx={{
                    alignSelf: "right",
                    marginTop: "30px",
                    marginBottom: "10px",
                    maxHeight: {xs: 100, md: 400},
                    maxWidth: {xs: 100, md: 400},
                }}
                src={Logo}/>
        </Stack>
        <DockerContainers/>
    </DockerMuiThemeProvider>);
}
