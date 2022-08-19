import { Alert, AlertTitle, Box, Button, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import InfoIcon from '@mui/icons-material/Info';
import React, { useEffect } from "react";
import { blueGrey } from "@mui/material/colors";
import { readyActiveMq, readyDb, readyRepo, readySolr, readyTransform, runningContainersJson, viewContainer } from "../helper/cli";
import { resources } from '../helper/resources'

function createData(
    image: string,
    version: string,
    name: string,
    state: string,
    id: string
  ) 
{
    return { image, version, name, state, id };
}

const getRows = async (
    setIsReady: React.Dispatch<React.SetStateAction<any>>,
    setIsError: React.Dispatch<React.SetStateAction<any>>) => {

    setIsReady(true)
    let rows = []

    try {
        const result = await runningContainersJson()
        var lines = result.toString().split(/\r?\n|\r|\n/g);
        for(let i = 0; i < lines.length; i++) {
            if (lines[i].length > 0) {
                let json = JSON.parse(lines[i])
                var imageParts = json.Image.split(':')
                let state = json.State
                if (json.Names === 'postgres') {
                    let status: string = await readyDb()
                    if (status.includes('rows')) {
                        state = 'READY'
                    } else {
                        state = 'STARTING'
                        setIsReady(false)
                    }
                }
                if (json.Names === 'alfresco') {
                    let status:string = await readyRepo()
                    if (status === '200') {
                        state = 'READY'
                    } else {
                        state = 'STARTING'
                        setIsReady(false)
                    }
                }
                if (json.Names === 'transform-core-aio') {
                    let status:string = await readyTransform()
                    if (status === '200') {
                        state = 'READY'
                    } else {
                        state = 'STARTING'
                        setIsReady(false)
                    }
                }
                if (json.Names === 'activemq') {
                    let status:string = await readyActiveMq()
                    if (status === '200') {
                        state = 'READY'
                    } else {
                        state = 'STARTING'
                        setIsReady(false)
                    }
                }
                if (json.Names === 'solr6') {
                    let status:string = await readySolr()
                    if (status === '200') {
                        state = 'READY'
                    } else {
                        state = 'STARTING'
                        setIsReady(false)
                    }
                }
                rows.push(createData(imageParts[0], imageParts[1], json.Names, state, json.ID))
            }
        }
    } catch (err) {
        setIsError(err)
        alert(JSON.stringify(err))
    }

    return rows

}

export const DockerContainerList = () => {

    const [isLoading, setIsLoading] = React.useState(false);
    const [isReady, setIsReady] = React.useState(false);
    const [isError, setIsError] = React.useState('')

    const [rows, setRows] = React.useState([])
    useEffect(() => {
        (async () => {
            setIsLoading(true)
            let rows = await getRows(setIsReady, setIsError)
            setRows(rows)
            setIsLoading(false)
        })()
      }, [])

    let statusComponent = {}
    if (isReady) {
        statusComponent = <Box>
                <Alert severity="success">
                    <AlertTitle>{resources.LIST.ALFRESCO_READY_TITLE}</AlertTitle>
                    {resources.LIST.ALFRESCO_READY_MESSAGE}
                </Alert>
            </Box>
    } else {
        statusComponent = <Box>
                <Alert severity="warning">
                    <AlertTitle>{resources.LIST.ALFRESCO_STARTING_TITLE}</AlertTitle>
                    {resources.LIST.ALFRESCO_STARTING_MESSAGE}
                </Alert>
            </Box>
    }

    let errorComponent: {}
    if (isError !== '') {
        errorComponent = <Box>
            <Alert severity="error">
                <AlertTitle>ERROR</AlertTitle>
                {isError}
            </Alert>
        </Box>
    }
    
    if (isLoading) {
        return <Box sx={{
            marginBottom: "15px",
            textAlign: "center"
        }}>
            <CircularProgress
                size={50}
                sx={{
                    color: blueGrey[500],
                }}
            />
        </Box>
    } else if (rows.length === 0) {
        return <React.Fragment></React.Fragment>
    } else {
        return (
            <React.Fragment>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><b>{resources.LIST.IMAGE}</b></TableCell>
                            <TableCell><b>{resources.LIST.VERSION}</b></TableCell>
                            <TableCell><b>{resources.LIST.NAME}</b></TableCell>
                            <TableCell align="center"><b>{resources.LIST.STATUS}</b></TableCell>
                            <TableCell align="center"><b>{resources.LIST.DETAILS}</b></TableCell>
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
                        <TableCell align="center">{row.state}</TableCell>
                        <TableCell align="right">
                            <Button onClick={() => {
                                    viewContainer(row.id)
                                }}>
                                <InfoIcon/>
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
    }
}
