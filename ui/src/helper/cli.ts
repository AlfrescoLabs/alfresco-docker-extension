import { createDockerDesktopClient } from '@docker/extension-api-client';
import { ServiceConfiguration } from '../alfresco/types';
// DOCKER DESKTOP Client
const ddClient = createDockerDesktopClient();

// Return Docker available RAM in GB
export const getDockerInfo = async () => {
  try {
    const result = await ddClient.docker.cli.exec('info', [
      '--format',
      '"{{json .}}"',
    ]);
    return result.parseJsonObject();
  } catch (err) {
    console.log('checkRamAvailableError : ', JSON.stringify(err));
    return err;
  }
};

const getHostPorts = (data: any[]): string => {
  const hostPorts: string[] = [];

  try {
    data.forEach(container => {
        const ports = container.NetworkSettings?.Ports;
        if (ports) {
            for (const port in ports) {
                if (ports[port] && Array.isArray(ports[port])) {
                    ports[port].forEach((portDetail: { HostPort?: string }) => {
                        if (portDetail && portDetail.HostPort) {
                            hostPorts.push(portDetail.HostPort);
                        }
                    });
                }
            }
        }
    });
  } catch (e) {
    return e.Message;
  }

  return hostPorts.join(',');
};

export async function listAllContainers(
  configuration: ServiceConfiguration[],
): Promise<any[]> {
  let containers = [];
  await Promise.all(configuration.map(async(s) => {
    let inspectResult;
    try {
      inspectResult = await ddClient.docker.cli.exec("inspect", [
        "--type",
        "container",
        s.service,
      ]);
    } catch (error) {
      console.info(
        "Error from inspect, probably didn't find container " + s.service + ", which happens when it has not yet started. This is likely not an issue.",
        error
      );    
    }
    if (inspectResult) {
      const inspectJson: Array<any> = JSON.parse(inspectResult.stdout);
      const containerInfo = inspectJson[0];
      let container = {
        Id: containerInfo.Id,
        Image: containerInfo.Image,
        Names: [containerInfo.Name],
        State: containerInfo.State?.Status,
        Status: containerInfo.State,
        Port: getHostPorts(inspectJson),
      }
      containers.push(container);
    }
  }));
  return containers;
}

export async function listAllImages(
  configuration: ServiceConfiguration[],
): Promise<any[]> {
  const containerList = (await ddClient.docker.listImages({
    filters: JSON.stringify({
      reference: configuration.map((s) => s.image),
    }),
  })) as any[];
  return containerList;
}
// Create 'alfresco' network if it didn't exist
export const createNetwork = async (name: string) => {
  try {
    await ddClient.docker.cli.exec('network', ['inspect', name]);
  } catch (err) {
    await ddClient.docker.cli.exec('network', ['create', name]);
  }
};

function groupByRunOrder(
  services: ServiceConfiguration[]
): ServiceConfiguration[][] {
  return Object.values(
    services.reduce((acc, s) => {
      (acc[s.run.order] = acc[s.run.order] || []).push(s);
      return acc;
    }, {})
  );
}

export async function runContainers(exposePorts: boolean, services: ServiceConfiguration[]) {
  await createNetwork('alfresco');
  const runGroups = groupByRunOrder(services);
  runGroups.forEach(async (group) => {
    await Promise.all(group.map(service => deployService(exposePorts, service)));
  });
}

export async function setup(services: ServiceConfiguration[]) {
  await Promise.all(services.map(pullImage));
}

// Stop running containers in 'alfresco' network
export const stopContainers = async (services: ServiceConfiguration[]) => {
  const containers = await listAllContainers(services);
  const containersId = containers.map((c) => c.Id);
  try {
    await ddClient.docker.cli.exec('stop', containersId);
    // Remove also volumes created by the containers
    containersId.unshift('-v');
    await ddClient.docker.cli.exec('rm', containersId);
  } catch (e) {
    console.warn(e);
  }
};

// Remove a container if it exists
export const removeContainer = async (containerName: string) => {
  const result = await ddClient.docker.cli.exec('ps', [
    '-q',
    '-a',
    '-f',
    'name=' + containerName,
    '-f',
    'network=alfresco',
  ]);
  if (result.stdout.length > 0) {
    await ddClient.docker.cli.exec('container', ['rm', '-f', '-v', containerName]);
  }
};
export async function deployService(exposePorts: boolean, config: ServiceConfiguration) {
  const running = await ddClient.docker.cli.exec('ps', [
    '-f',
    'status=running',
    '-f',
    'name=' + config.service,
    '-f',
    'network=alfresco',
    '-q',
  ]);
  if (running.stdout.length === 0) {
    await removeContainer(config.service);
    ddClient.docker.cli.exec('container', ['rm', '-f', '-v', config.service]);
    await ddClient.docker.cli.exec('run', [
      '-d',
      '--rm',
      '--name',
      config.service,
      '--network',
      'alfresco',
      ...config.run.options,
      (exposePorts ? config.run.ports : ''),
      config.image,
      config.run.cmd,
    ]);
  }
}
async function pullImage(config: ServiceConfiguration) {
  await ddClient.docker.cli.exec('pull', [config.image]);
}
export function readyCheckFn(service: string, cmd: string) {
  return async () => {
    try {
      const result = await ddClient.docker.cli.exec('exec', [service, cmd]);
      return result.stdout;
    } catch (err) {
      return 'false';
    }
  };
}

export const waitTillReadyDb = async () => {
  try {
    await ddClient.docker.cli.exec('exec', [
      'postgres',
      'psql -U alfresco -c "select 1 where false"',
    ]);
    return true;
  } catch (err) {
    waitTillReadyDb();
  }
};

export const viewContainer = async (id: string) => {
  try {
    await ddClient.desktopUI.navigate.viewContainer(id);
  } catch (err) {
    ddClient.desktopUI.toast.warning("This action is only enabled when 'Show Docker Extensions system containers' option is checked");
  }
};

export const openAlfrescoInBrowser = async () => {
  ddClient.host.openExternal('http://localhost:8080/content-app/');
};
