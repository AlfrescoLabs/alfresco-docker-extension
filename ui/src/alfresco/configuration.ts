export const RAM_LIMIT = 10;

const POSTGRES_IMAGE_TAG = 'postgres:13.3';
const ACTIVEMQ_IMAGE_TAG = 'alfresco/alfresco-activemq:5.16.4-jre11-centos7';
const TRANSFORM_IMAGE_TAG = 'alfresco/alfresco-transform-core-aio:2.5.7';
const REPO_IMAGE_TAG = 'alfresco/alfresco-content-repository-community:7.2.0';
const SOLR_IMAGE_TAG = 'alfresco/alfresco-search-services:2.0.3';
const ACA_IMAGE_TAG = 'alfresco/alfresco-content-app:2.9.0';
const PROXY_IMAGE_TAG = 'alfresco/alfresco-acs-nginx:3.4.2';
export type ServiceConfiguration = {
  service:
    | 'activemq'
    | 'solr6'
    | 'transform-core-aio'
    | 'postgres'
    | 'alfresco'
    | 'proxy'
    | 'content-app';
  network: string;
  image: string;
  run: { options: string[]; cmd: string; order: number };
  readyCheck: { cmd: string; check: '200' | 'ROWS' };
};

export const ALFRESCO_7_2_CONFIGURATION: ServiceConfiguration[] = [
  {
    service: 'alfresco',
    network: 'alfresco',
    image: REPO_IMAGE_TAG,
    run: {
      options: [
        '--memory',
        '3328m',
        '-e',
        'JAVA_TOOL_OPTIONS="-Dencryption.keystore.type=JCEKS -Dencryption.cipherAlgorithm=DESede/CBC/PKCS5Padding -Dencryption.keyAlgorithm=DESede -Dencryption.keystore.location=/usr/local/tomcat/shared/classes/alfresco/extension/keystore/keystore -Dmetadata-keystore.password=mp6yc0UD9e -Dmetadata-keystore.aliases=metadata -Dmetadata-keystore.metadata.password=oKIWzVdEdA -Dmetadata-keystore.metadata.algorithm=DESede"',
        '-e',
        'JAVA_OPTS="-Ddb.driver=org.postgresql.Driver -Ddb.username=alfresco -Ddb.password=alfresco -Ddb.url=jdbc:postgresql://postgres:5432/alfresco -Dsolr.host=solr6 -Dsolr.port=8983 -Dsolr.http.connection.timeout=1000 -Dsolr.secureComms=secret -Dsolr.sharedSecret=secret -Dsolr.base.url=/solr -Dindex.subsystem.name=solr6 -Dshare.host=127.0.0.1 -Dshare.port=8080 -Dalfresco.host=localhost -Dalfresco.port=8080 -Daos.baseUrlOverwrite=http://localhost:8080/alfresco/aos -Dmessaging.broker.url=\'failover:(nio://activemq:61616)?timeout=3000&jms.useCompression=true\' -Ddeployment.method=DOCKER_COMPOSE -DlocalTransform.core-aio.url=http://transform-core-aio:8090/ -Dcsrf.filter.enabled=false -XX:MinRAMPercentage=50 -XX:MaxRAMPercentage=80"',
      ],
      cmd: '',
      order: 2,
    },
    readyCheck: { cmd: '', check: '200' },
  },
  {
    service: 'postgres',
    network: 'alfresco',
    image: POSTGRES_IMAGE_TAG,
    run: {
      options: [
        '--memory',
        '768m',
        '-p',
        '5432:5432',
        '-e',
        'POSTGRES_PASSWORD=alfresco',
        '-e',
        'POSTGRES_USER=alfresco',
        '-e',
        'POSTGRES_DB=alfresco',
      ],
      cmd: 'postgres -c max_connections=200 -c logging_collector=on -c log_min_messages=LOG -c log_directory=/var/log/postgresql',
      order: 0,
    },
    readyCheck: { cmd: '', check: 'ROWS' },
  },
  {
    service: 'activemq',
    network: 'alfresco',
    image: ACTIVEMQ_IMAGE_TAG,
    run: {
      options: ['--memory', '768m', '-p', '8161:8161'],
      cmd: '',
      order: 0,
    },
    readyCheck: { cmd: '', check: '200' },
  },
  {
    service: 'transform-core-aio',
    network: 'alfresco',
    image: TRANSFORM_IMAGE_TAG,
    run: {
      options: [
        '--memory',
        '1536m',
        '-e',
        'JAVA_OPTS="-XX:MinRAMPercentage=50 -XX:MaxRAMPercentage=80 -Dserver.tomcat.threads.max=12 -Dserver.tomcat.threads.min=4 -Dlogging.level.org.alfresco.transform.router.TransformerDebug=ERROR"',
      ],
      cmd: '',
      order: 1,
    },
    readyCheck: { cmd: '', check: '200' },
  },
  {
    service: 'solr6',
    network: 'alfresco',
    image: SOLR_IMAGE_TAG,
    run: {
      options: [
        '--memory',
        '1024m',
        '-e',
        'SOLR_ALFRESCO_HOST=alfresco',
        '-e',
        'SOLR_ALFRESCO_PORT=8080',
        '-e',
        'SOLR_SOLR_HOST=solr6',
        '-e',
        'SOLR_SOLR_PORT=8983',
        '-e',
        'SOLR_CREATE_ALFRESCO_DEFAULTS=alfresco,archive',
        '-e',
        'ALFRESCO_SECURE_COMMS=secret',
        '-e',
        'JAVA_TOOL_OPTIONS="-Dalfresco.secureComms.secret=secret"',
        '-p',
        '8083:8983',
      ],
      cmd: '',
      order: 1,
    },
    readyCheck: { cmd: '', check: '200' },
  },
  {
    service: 'proxy',
    network: 'alfresco',
    image: PROXY_IMAGE_TAG,
    run: {
      options: [
        '--memory',
        '128m',
        '-e',
        'DISABLE_PROMETHEUS=true',
        '-e',
        'DISABLE_SYNCSERVICE=true',
        '-e',
        'DISABLE_ADW=true',
        '-e',
        'DISABLE_CONTROL_CENTER=true',
        '-e',
        'DISABLE_SHARE=true',
        '-e',
        'ENABLE_CONTENT_APP=true',
        '-p',
        '8080:8080',
      ],
      cmd: '',
      order: 4,
    },
    readyCheck: { cmd: '', check: '200' },
  },
  {
    service: 'content-app',
    network: 'alfresco',
    image: ACA_IMAGE_TAG,
    run: {
      options: ['--memory', '256m'],
      cmd: '',
      order: 1,
    },
    readyCheck: { cmd: '', check: '200' },
  },
];
