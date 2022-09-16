import { createDockerDesktopClient } from '@docker/extension-api-client';
import { ACTIVEMQ_IMAGE_TAG, POSTGRES_IMAGE_TAG, REPO_IMAGE_TAG, SOLR_IMAGE_TAG, TRANSFORM_IMAGE_TAG } from '../helper/constants'

export const refreshData = async () => {
    window.location.reload();
}

// DOCKER DESKTOP Client
const ddClient = createDockerDesktopClient();

// Return Docker available RAM in GB
export const getDockerInfo = async () => {
    try {
        const result = await ddClient.docker.cli.exec('info', [
          '--format',
          '"{{json .}}"',
        ])
        return result.parseJsonObject()
      } catch (err) {
        console.log("checkRamAvailableError : ", JSON.stringify(err))
        return err
    }
}

// List of known containers running
export const getContainersRunning = async () => {
    try {
        const result = await ddClient.docker.cli.exec('ps', [
            '-q',
            '-f', 'status=running',
            '-f', 'name=alfresco',
            '-f', 'name=postgres',
            '-f', 'name=activemq',
            '-f', 'name=solr6',
            '-f', 'name=transform-core-aio'
        ])
        return result.stdout
    } catch (err) {
        return JSON.stringify(err)
    }
}

export const containerListJson = async () => { 

    const result = await ddClient.docker.cli.exec('ps', [
        '-a',
        '-f', 'name=alfresco',
        '-f', 'name=postgres',
        '-f', 'name=activemq',
        '-f', 'name=transform-core-aio',
        '-f', 'name=solr6',
        '--no-trunc',
        '--format', '"{{json .}}"'
    ])
    return result.stdout

}

// Create 'alfresco' network if it didn't exist
export const createNetwork = async () => {
    try {
        await ddClient.docker.cli.exec('network', [ 'inspect', 'alfresco' ])
    } catch (err) {
        await ddClient.docker.cli.exec('network', [ 'create', 'alfresco' ])
    }
}

// Stop running containers in 'alfresco' network
export const stopContainers  = async () => {
    const containers = await ddClient.docker.cli.exec('ps', ['-a', '-qf', '"network=alfresco"'])
    await ddClient.docker.cli.exec('stop', containers.stdout.split(/\r?\n|\r|\n/g))
    await ddClient.docker.cli.exec('rm', containers.stdout.split(/\r?\n|\r|\n/g))
}

// Remove a container if it exists
export const removeContainer = async (containerName: string) => {
    const result = await ddClient.docker.cli.exec('ps', [
        '-q', '-a',
        '-f', 'name=' + containerName
        ])
    if (result.stdout.length > 0) {
        await ddClient.docker.cli.exec('container', [
            'rm', '-v', containerName
        ])
    }
}

export const deployDb = async () => {

    const running = await ddClient.docker.cli.exec('ps', [
        '-f', 'status=running', '-f', 'name=postgres', '-q'
    ])

    if (running.stdout.length === 0) {

        await removeContainer('postgres')

        await ddClient.docker.cli.exec('run', [
            '-d',
            '--memory', '768m',
            '--name', 'postgres',
            '-p', '5432:5432',
            '-e', 'POSTGRES_PASSWORD=alfresco',
            '-e', 'POSTGRES_USER=alfresco',
            '-e', 'POSTGRES_DB=alfresco',
            '--network', 'alfresco',
            POSTGRES_IMAGE_TAG,
            'postgres -c max_connections=200 -c logging_collector=on -c log_min_messages=LOG -c log_directory=/var/log/postgresql'
        ])

    }

}

export const deployMq = async () => {

    const running = await ddClient.docker.cli.exec('ps', [
        '-f', 'status=running', '-f', 'name=activemq', '-q'
    ])

    if (running.stdout.length === 0) {

        await removeContainer('activemq')

        await ddClient.docker.cli.exec('run', [
            '-d',
            '--memory', '768m',
            '--name', 'activemq',
            '-p', '8161:8161',
            '--network', 'alfresco',
            ACTIVEMQ_IMAGE_TAG
        ])

    }

}

export const deployTransform = async () => {

    const running = await ddClient.docker.cli.exec('ps', [
        '-f', 'status=running', '-f', 'name=transform-core-aio', '-q'
    ])

    if (running.stdout.length === 0) {

        await removeContainer('transform-core-aio')

        await ddClient.docker.cli.exec('run', [
            '-d',
            '--memory', '1536m',
            '--name', 'transform-core-aio',
            '-e', 'JAVA_OPTS="-XX:MinRAMPercentage=50 -XX:MaxRAMPercentage=80 -Dserver.tomcat.threads.max=12 -Dserver.tomcat.threads.min=4 -Dlogging.level.org.alfresco.transform.router.TransformerDebug=ERROR"',
            '--network', 'alfresco',
            TRANSFORM_IMAGE_TAG
        ])

    }

}

export const deployRepository = async () => {

    const running = await ddClient.docker.cli.exec('ps', [
        '-f', 'status=running', '-f', 'name=alfresco', '-q'
    ])

    if (running.stdout.length === 0) {

        await removeContainer('alfresco')

        await ddClient.docker.cli.exec('run', [
            '-d',
            '--memory', '3328m',
            '--name', 'alfresco',
            '-e', 'JAVA_TOOL_OPTIONS="-Dencryption.keystore.type=JCEKS -Dencryption.cipherAlgorithm=DESede/CBC/PKCS5Padding -Dencryption.keyAlgorithm=DESede -Dencryption.keystore.location=/usr/local/tomcat/shared/classes/alfresco/extension/keystore/keystore -Dmetadata-keystore.password=mp6yc0UD9e -Dmetadata-keystore.aliases=metadata -Dmetadata-keystore.metadata.password=oKIWzVdEdA -Dmetadata-keystore.metadata.algorithm=DESede"',
            '-e', 'JAVA_OPTS="-Ddb.driver=org.postgresql.Driver -Ddb.username=alfresco -Ddb.password=alfresco -Ddb.url=jdbc:postgresql://postgres:5432/alfresco -Dsolr.host=solr6 -Dsolr.port=8983 -Dsolr.http.connection.timeout=1000 -Dsolr.secureComms=secret -Dsolr.sharedSecret=secret -Dsolr.base.url=/solr -Dindex.subsystem.name=solr6 -Dshare.host=127.0.0.1 -Dshare.port=8080 -Dalfresco.host=localhost -Dalfresco.port=8080 -Daos.baseUrlOverwrite=http://localhost:8080/alfresco/aos -Dmessaging.broker.url=\'failover:(nio://activemq:61616)?timeout=3000&jms.useCompression=true\' -Ddeployment.method=DOCKER_COMPOSE -DlocalTransform.core-aio.url=http://transform-core-aio:8090/ -Dcsrf.filter.enabled=false -XX:MinRAMPercentage=50 -XX:MaxRAMPercentage=80"',
            '-p', '8080:8080',
            '--network', 'alfresco',
            REPO_IMAGE_TAG
        ])

    }

}

export const deploySolr = async () => {
    
    const running = await ddClient.docker.cli.exec('ps', [
        '-f', 'status=running', '-f', 'name=solr6', '-q'
    ])

    if (running.stdout.length === 0) {

        await removeContainer('solr6')

        await ddClient.docker.cli.exec('run', [
            '-d',
            '--memory', '1024m',
            '--name', 'solr6',
            '-e', 'SOLR_ALFRESCO_HOST=alfresco',
            '-e', 'SOLR_ALFRESCO_PORT=8080',
            '-e', 'SOLR_SOLR_HOST=solr6',
            '-e', 'SOLR_SOLR_PORT=8983',
            '-e', 'SOLR_CREATE_ALFRESCO_DEFAULTS=alfresco,archive',
            '-e', 'ALFRESCO_SECURE_COMMS=secret',
            '-e', 'JAVA_TOOL_OPTIONS="-Dalfresco.secureComms.secret=secret"',
            '-p', '8083:8983',
            '--network', 'alfresco',
            SOLR_IMAGE_TAG
        ])

    }

}

export const readyRepo = async() => {
    try {
        const result = await ddClient.docker.cli.exec('exec', [
            'alfresco', 'bash -c "curl -s -o /dev/null --max-time 1 -w "%{http_code}" http://localhost:8080/alfresco/s/api/server"'
        ])
        return result.stdout
    } catch (err) {
        console.error(JSON.stringify(err))
        return 'false'
    }
}

export const readySolr = async() => {
    try {
        const result = await ddClient.docker.cli.exec('exec', [
            'solr6', 'bash -c "curl -s -L -o /dev/null --max-time 1 -w "%{http_code}" --header "X-Alfresco-Search-Secret:secret" http://localhost:8983/solr"'
        ])
        return result.stdout
    } catch (err) {
        console.error(JSON.stringify(err))
        return 'false'
    }
}


export const readyActiveMq = async() => {
    try {
        const result = await ddClient.docker.cli.exec('exec', [
            'activemq', 'bash -c "curl -u admin:admin -L -s -o /dev/null --max-time 1 -w "%{http_code}" http://localhost:8161"'
        ])
        return result.stdout
    } catch (err) {
        console.error(JSON.stringify(err))
        return 'false'
    }
}

export const readyTransform = async() => {
    try {
        const result = await ddClient.docker.cli.exec('exec', [
            'transform-core-aio', 'bash -c "curl -s -o /dev/null --max-time 1 -w "%{http_code}" http://localhost:8090"'
        ])
        return result.stdout
    } catch (err) {
        console.error(JSON.stringify(err))
        return 'false'
    }
}

export const readyDb = async () => {
    try {
        const result = await ddClient.docker.cli.exec('exec', [
            'postgres',
            'psql -U alfresco -c "select 1 where false"'
        ])
        return result.stdout
    } catch (err) {
        console.error(JSON.stringify(err))
        return 'false'
    }
}

export const waitTillReadyDb = async () => {
    try {
        await ddClient.docker.cli.exec('exec', [
            'postgres',
            'psql -U alfresco -c "select 1 where false"'
        ])
        return true
    } catch (err) {
        waitTillReadyDb()
    }
}

export const viewContainer = async (id: string) => {
    await ddClient.desktopUI.navigate.viewContainer(id);
};

export const openAlfrescoInBrowser = async() => {
    ddClient.host.openExternal('http://localhost:8080/alfresco')
};

