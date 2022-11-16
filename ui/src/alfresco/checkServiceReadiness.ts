import { readyCheckFn } from '../helper/cli';
import { Service } from './types';

function isReturning200(restCall) {
  return async () => {
    let status: string = await restCall();
    return status === '200';
  };
}
function isReturningRows(restCall) {
  return async () => {
    let status: string = await restCall();
    return status.includes('rows');
  };
}
const readyCheckPolicies = Object.freeze({
  postgres: isReturningRows(
    readyCheckFn('postgres', 'psql -U alfresco -c "select 1 where false"')
  ),
  alfresco: isReturning200(
    readyCheckFn(
      'alfresco',
      'bash -c "curl -s -o /dev/null --max-time 1 -w "%{http_code}" http://localhost:8080/alfresco/s/api/server"'
    )
  ),
  'transform-core-aio': isReturning200(
    readyCheckFn(
      'transform-core-aio',
      'bash -c "curl -s -o /dev/null --max-time 1 -w "%{http_code}" http://localhost:8090"'
    )
  ),
  solr6: isReturning200(
    readyCheckFn(
      'solr6',
      'bash -c "curl -s -L -o /dev/null --max-time 1 -w "%{http_code}" --header "X-Alfresco-Search-Secret:secret" http://localhost:8983/solr"'
    )
  ),
  activemq: isReturning200(
    readyCheckFn(
      'activemq',
      'bash -c "curl -u admin:admin -L -s -o /dev/null --max-time 1 -w "%{http_code}" http://localhost:8161"'
    )
  ),
  'content-app': isReturning200(
    readyCheckFn(
      'content-app',
      'sh -c "curl -s -o /dev/null --max-time 1 -w "%{http_code}" http://localhost:8080/"'
    )
  ),
  proxy: isReturning200(
    readyCheckFn(
      'proxy',
      'sh -c "curl -s -o /dev/null --max-time 1 -w "%{http_code}" http://localhost:8080/content-app/"'
    )
  ),
});

export async function isReady(service: Service): Promise<boolean> {
  let readyFn = readyCheckPolicies[service.name];
  let isR = false;
  if (readyFn) {
    isR = await readyFn();
  }
  return isR;
}
