import { ServiceConfiguration } from './types';

export const RAM_LIMIT = 12;
const DEFAULT_ACTIVEMQ_USER = 'admin';
const DEFAULT_ACTIVEMQ_PASSWORD = 'admin';
// Shared secret between the Alfresco repository and the search stack (OpenSearch
// batch-indexer). Both sides must use the same value.
const DEFAULT_SEARCH_SHARED_SECRET = 'secret';

type option = {
  name: string;
  image: string;
};
type configurationFactoryMap = Record<string, (image: string) => any>;

function alfrescoJavaOpts(useActiveMqCredentials = false): string {
  const brokerCredentials = useActiveMqCredentials
    ? ` -Dmessaging.broker.username=${DEFAULT_ACTIVEMQ_USER} -Dmessaging.broker.password=${DEFAULT_ACTIVEMQ_PASSWORD}`
    : '';

  return `JAVA_OPTS="-Ddb.driver=org.postgresql.Driver -Ddb.username=alfresco -Ddb.password=alfresco -Ddb.url=jdbc:postgresql://postgres:5432/alfresco -Dsolr.host=solr6 -Dsolr.port=8983 -Dsolr.http.connection.timeout=1000 -Dsolr.secureComms=secret -Dsolr.sharedSecret=secret -Dsolr.base.url=/solr -Dindex.subsystem.name=solr6 -Dshare.host=127.0.0.1 -Dshare.port=8080 -Dalfresco.host=localhost -Dalfresco.port=8080 -Daos.baseUrlOverwrite=http://localhost:8080/alfresco/aos -Dmessaging.broker.url='failover:(nio://activemq:61616)?timeout=3000&jms.useCompression=true'${brokerCredentials} -Ddeployment.method=DOCKER_COMPOSE -DlocalTransform.core-aio.url=http://transform-core-aio:8090/ -Dhttpclient.config.transform.connectionRequestTimeout=500000 -Dcsrf.filter.enabled=false -XX:MinRAMPercentage=50 -XX:MaxRAMPercentage=80"`;
}

// JAVA_OPTS for Alfresco 26.2+, which replaces the Solr 6 search subsystem with
// the OpenSearch-based 'elasticsearch' subsystem (Alfresco Search Community).
function alfrescoJavaOpts26_2(): string {
  const brokerCredentials = ` -Dmessaging.broker.username=${DEFAULT_ACTIVEMQ_USER} -Dmessaging.broker.password=${DEFAULT_ACTIVEMQ_PASSWORD}`;

  return `JAVA_OPTS="-Ddb.driver=org.postgresql.Driver -Ddb.username=alfresco -Ddb.password=alfresco -Ddb.url=jdbc:postgresql://postgres:5432/alfresco -Dindex.subsystem.name=elasticsearch -Delasticsearch.host=opensearch -Delasticsearch.port=9200 -Delasticsearch.createIndexIfNotExists=true -Dsolr.secureComms=secret -Dsolr.sharedSecret=${DEFAULT_SEARCH_SHARED_SECRET} -Dalfresco.restApi.basicAuthScheme=true -Dshare.host=127.0.0.1 -Dshare.port=8080 -Dalfresco.host=localhost -Dalfresco.port=8080 -Daos.baseUrlOverwrite=http://localhost:8080/alfresco/aos -Dmessaging.broker.url='failover:(nio://activemq:61616)?timeout=3000&jms.useCompression=true'${brokerCredentials} -Ddeployment.method=DOCKER_COMPOSE -DlocalTransform.core-aio.url=http://transform-core-aio:8090/ -Dhttpclient.config.transform.connectionRequestTimeout=500000 -Dcsrf.filter.enabled=false -XX:MinRAMPercentage=50 -XX:MaxRAMPercentage=80"`;
}

function activeMqRunOptions(useCredentials = false): string[] {
  const options = ['--memory', '768m'];

  if (useCredentials) {
    options.push(
      '-e',
      `ACTIVEMQ_ADMIN_LOGIN=${DEFAULT_ACTIVEMQ_USER}`,
      '-e',
      `ACTIVEMQ_ADMIN_PASSWORD=${DEFAULT_ACTIVEMQ_PASSWORD}`
    );
  }

  return options;
}

function createConfigurationFor(
  components: option[],
  configurationMap: configurationFactoryMap = ConfigurationMap
): ServiceConfiguration[] {
  return components.map(({ name, image }) => configurationMap[name](image));
}
const ConfigurationMap = {
  alfresco: (image: string) => ({
    service: 'alfresco',
    image,
    run: {
      options: [
        '--memory',
        '3328m',
        '-e',
        'JAVA_TOOL_OPTIONS="-Dencryption.keystore.type=JCEKS -Dencryption.cipherAlgorithm=DESede/CBC/PKCS5Padding -Dencryption.keyAlgorithm=DESede -Dencryption.keystore.location=/usr/local/tomcat/shared/classes/alfresco/extension/keystore/keystore -Dmetadata-keystore.password=mp6yc0UD9e -Dmetadata-keystore.aliases=metadata -Dmetadata-keystore.metadata.password=oKIWzVdEdA -Dmetadata-keystore.metadata.algorithm=DESede"',
        '-e',
        alfrescoJavaOpts(),
      ],
      cmd: '',
      ports: '',
      order: 2,
    },
  }),
  postgres: (image: string) => ({
    service: 'postgres',
    image,
    run: {
      options: [
        '--memory',
        '768m',
        '-e',
        'POSTGRES_PASSWORD=alfresco',
        '-e',
        'POSTGRES_USER=alfresco',
        '-e',
        'POSTGRES_DB=alfresco',
      ],
      cmd: 'postgres -c max_connections=200 -c logging_collector=on -c log_min_messages=LOG -c log_directory=/var/log/postgresql',
      ports: '-p 5432:5432',
      order: 0,
    },
  }),
  activemq: (image: string) => ({
    service: 'activemq',
    image,
    run: {
      options: activeMqRunOptions(),
      cmd: '',
      ports: '-p 61616:61616 -p 8161:8161',
      order: 0,
    },
  }),
  'transform-core-aio': (image: string) => ({
    service: 'transform-core-aio',
    image,
    run: {
      options: [
        '--memory',
        '1536m',
        '-e',
        'JAVA_OPTS="-XX:MinRAMPercentage=50 -XX:MaxRAMPercentage=80 -Dserver.tomcat.threads.max=12 -Dserver.tomcat.threads.min=4 -Dlogging.level.org.alfresco.transform.router.TransformerDebug=ERROR"',
      ],
      cmd: '',
      ports: '-p 8090:8090',
      order: 1,
    },
  }),
  solr6: (image: string) => ({
    service: 'solr6',
    image,
    run: {
      options: [
        '--memory',
        '1536m',
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
      ],
      cmd: '',
      ports: '-p 8983:8983',
      order: 1,
    },
  }),
  proxy: (image: string) => ({
    service: 'proxy',
    image,
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
      ports: '',
      order: 4,
    },
  }),
  'content-app': (image: string) => ({
    service: 'content-app',
    image,
    run: {
      options: ['--memory', '256m'],
      cmd: '',
      ports: '',
      order: 1,
    },
  }),
};
const ConfigurationMap26_1 = {
  ...ConfigurationMap,
  alfresco: (image: string) => ({
    ...ConfigurationMap.alfresco(image),
    run: {
      ...ConfigurationMap.alfresco(image).run,
      options: [
        '--memory',
        '3328m',
        '-e',
        'JAVA_TOOL_OPTIONS="-Dencryption.keystore.type=JCEKS -Dencryption.cipherAlgorithm=DESede/CBC/PKCS5Padding -Dencryption.keyAlgorithm=DESede -Dencryption.keystore.location=/usr/local/tomcat/shared/classes/alfresco/extension/keystore/keystore -Dmetadata-keystore.password=mp6yc0UD9e -Dmetadata-keystore.aliases=metadata -Dmetadata-keystore.metadata.password=oKIWzVdEdA -Dmetadata-keystore.metadata.algorithm=DESede"',
        '-e',
        alfrescoJavaOpts(true),
      ],
    },
  }),
  activemq: (image: string) => ({
    ...ConfigurationMap.activemq(image),
    run: {
      ...ConfigurationMap.activemq(image).run,
      options: activeMqRunOptions(true),
    },
  }),
};
// Alfresco 26.2 drops the Solr 6 search service in favour of Alfresco Search
// Community (OpenSearch cluster + batch-indexing application). The repository
// now points at the 'elasticsearch' subsystem, and two new services replace
// 'solr6': 'opensearch' (the search cluster) and 'batch-indexer' (continuous
// synchronization from the repository into OpenSearch).
const ConfigurationMap26_2 = {
  ...ConfigurationMap26_1,
  alfresco: (image: string) => ({
    ...ConfigurationMap.alfresco(image),
    run: {
      ...ConfigurationMap.alfresco(image).run,
      options: [
        '--memory',
        '3328m',
        '-e',
        'JAVA_TOOL_OPTIONS="-Dencryption.keystore.type=JCEKS -Dencryption.cipherAlgorithm=DESede/CBC/PKCS5Padding -Dencryption.keyAlgorithm=DESede -Dencryption.keystore.location=/usr/local/tomcat/shared/classes/alfresco/extension/keystore/keystore -Dmetadata-keystore.password=mp6yc0UD9e -Dmetadata-keystore.aliases=metadata -Dmetadata-keystore.metadata.password=oKIWzVdEdA -Dmetadata-keystore.metadata.algorithm=DESede"',
        '-e',
        alfrescoJavaOpts26_2(),
      ],
    },
  }),
  opensearch: (image: string) => ({
    service: 'opensearch',
    image,
    run: {
      options: [
        '--memory',
        '1152m',
        '-e',
        'discovery.type=single-node',
        '-e',
        'DISABLE_SECURITY_PLUGIN=true',
        '-e',
        'OPENSEARCH_JAVA_OPTS=-Xms512m -Xmx512m',
      ],
      cmd: '',
      ports: '-p 9200:9200',
      order: 0,
    },
  }),
  'batch-indexer': (image: string) => ({
    service: 'batch-indexer',
    image,
    run: {
      options: [
        '--memory',
        '1024m',
        '-e',
        'SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/alfresco',
        '-e',
        'SPRING_DATASOURCE_USERNAME=alfresco',
        '-e',
        'SPRING_DATASOURCE_PASSWORD=alfresco',
        '-e',
        'SPRING_ELASTICSEARCH_REST_URIS=http://opensearch:9200',
        '-e',
        'ALFRESCO_ACS_URL=http://alfresco:8080',
        '-e',
        'ALFRESCO_ACCEPTEDCONTENTMEDIATYPESCACHE_BASEURL=http://transform-core-aio:8090/transform/config',
        '-e',
        `ALFRESCO_CONTENT_TRANSFORM_SHAREDSECRET=${DEFAULT_SEARCH_SHARED_SECRET}`,
        '-e',
        'ALFRESCO_REINDEX_CONTINUOUS_POLLINGINTERVAL=15s',
        '-e',
        'JAVA_OPTS=-Xms256m -Xmx768m',
      ],
      cmd: '',
      ports: '',
      order: 3,
    },
  }),
};
export const ALFRESCO_7_2_CONFIGURATION: ServiceConfiguration[] =
  createConfigurationFor([
    {
      name: 'alfresco',
      image: 'alfresco/alfresco-content-repository-community:7.2.0',
    },
    {
      name: 'activemq',
      image: 'alfresco/alfresco-activemq:5.16.4-jre11-centos7',
    },
    { name: 'proxy', image: 'alfresco/alfresco-acs-nginx:3.4.2' },
    { name: 'content-app', image: 'alfresco/alfresco-content-app:2.9.0' },
    { name: 'solr6', image: 'alfresco/alfresco-search-services:2.0.3' },
    {
      name: 'transform-core-aio',
      image: 'alfresco/alfresco-transform-core-aio:2.5.7',
    },
    { name: 'postgres', image: 'postgres:13.3' },
  ]);
export const ALFRESCO_7_3_CONFIGURATION: ServiceConfiguration[] =
  createConfigurationFor([
    {
      name: 'alfresco',
      image: 'alfresco/alfresco-content-repository-community:7.3.0',
    },
    {
      name: 'activemq',
      image: 'alfresco/alfresco-activemq:5.17.1-jre11-rockylinux8',
    },
    { name: 'proxy', image: 'alfresco/alfresco-acs-nginx:3.4.2' },
    { name: 'content-app', image: 'alfresco/alfresco-content-app:3.1.0' },
    { name: 'solr6', image: 'alfresco/alfresco-search-services:2.0.5.1' },
    {
      name: 'transform-core-aio',
      image: 'alfresco/alfresco-transform-core-aio:3.0.0',
    },
    { name: 'postgres', image: 'postgres:14.4' },
  ]);
export const ALFRESCO_7_4_CONFIGURATION: ServiceConfiguration[] =
  createConfigurationFor([
    {
      name: 'alfresco',
      image: 'alfresco/alfresco-content-repository-community:7.4.0.1',
    },
    {
      name: 'activemq',
      image: 'alfresco/alfresco-activemq:5.17.1-jre11-rockylinux8',
    },
    { name: 'proxy', image: 'alfresco/alfresco-acs-nginx:3.4.2' },
    { name: 'content-app', image: 'alfresco/alfresco-content-app:4.0.0' },
    { name: 'solr6', image: 'alfresco/alfresco-search-services:2.0.7' },
    {
      name: 'transform-core-aio',
      image: 'alfresco/alfresco-transform-core-aio:3.1.0',
    },
    { name: 'postgres', image: 'postgres:14.4' },
  ]);
export const ALFRESCO_23_1_CONFIGURATION: ServiceConfiguration[] =
  createConfigurationFor([
    {
      name: 'alfresco',
      image: 'alfresco/alfresco-content-repository-community:23.1.0',
    },
    {
      name: 'activemq',
      image: 'alfresco/alfresco-activemq:5.17.1-jre11-rockylinux8',
    },
    { name: 'proxy', image: 'alfresco/alfresco-acs-nginx:3.4.2' },
    { name: 'content-app', image: 'alfresco/alfresco-content-app:4.3.0' },
    { name: 'solr6', image: 'alfresco/alfresco-search-services:2.0.8.2' },
    {
      name: 'transform-core-aio',
      image: 'alfresco/alfresco-transform-core-aio:5.0.0',
    },
    { name: 'postgres', image: 'postgres:14.4' },
  ]);
export const ALFRESCO_23_2_CONFIGURATION: ServiceConfiguration[] =
  createConfigurationFor([
    {
      name: 'alfresco',
      image: 'alfresco/alfresco-content-repository-community:23.2.1',
    },
    {
      name: 'activemq',
      image: 'alfresco/alfresco-activemq:5.18-jre17-rockylinux8',
    },
    { name: 'proxy', image: 'alfresco/alfresco-acs-nginx:3.4.2' },
    { name: 'content-app', image: 'alfresco/alfresco-content-app:4.4.1' },
    { name: 'solr6', image: 'alfresco/alfresco-search-services:2.0.9.1' },
    {
      name: 'transform-core-aio',
      image: 'alfresco/alfresco-transform-core-aio:5.1.0',
    },
    { name: 'postgres', image: 'postgres:15.6' },
  ]);    
export const ALFRESCO_23_4_CONFIGURATION: ServiceConfiguration[] =
  createConfigurationFor([
    {
      name: 'alfresco',
      image: 'alfresco/alfresco-content-repository-community:23.4.1',
    },
    {
      name: 'activemq',
      image: 'alfresco/alfresco-activemq:5.18-jre17-rockylinux8',
    },
    { name: 'proxy', image: 'alfresco/alfresco-acs-nginx:3.4.2' },
    { name: 'content-app', image: 'alfresco/alfresco-content-app:5.2.0' },
    { name: 'solr6', image: 'alfresco/alfresco-search-services:2.0.13' },
    {
      name: 'transform-core-aio',
      image: 'alfresco/alfresco-transform-core-aio:5.1.5',
    },
    { name: 'postgres', image: 'postgres:15.6' },
  ]);
  export const ALFRESCO_25_1_CONFIGURATION: ServiceConfiguration[] =
  createConfigurationFor([
    {
      name: 'alfresco',
      image: 'alfresco/alfresco-content-repository-community:25.1.0',
    },
    {
      name: 'activemq',
      image: 'alfresco/alfresco-activemq:5.18-jre17-rockylinux8',
    },
    { name: 'proxy', image: 'alfresco/alfresco-acs-nginx:3.4.2' },
    { name: 'content-app', image: 'alfresco/alfresco-content-app:6.0.0' },
    { name: 'solr6', image: 'alfresco/alfresco-search-services:2.0.15' },
    {
      name: 'transform-core-aio',
      image: 'alfresco/alfresco-transform-core-aio:5.1.7',
    },
    { name: 'postgres', image: 'postgres:15.6' },
  ]);  
  export const ALFRESCO_25_2_CONFIGURATION: ServiceConfiguration[] =
  createConfigurationFor([
    {
      name: 'alfresco',
      image: 'alfresco/alfresco-content-repository-community:25.2.0',
    },
    {
      name: 'activemq',
      image: 'alfresco/alfresco-activemq:5.18-jre17-rockylinux8',
    },
    { name: 'proxy', image: 'alfresco/alfresco-acs-nginx:3.4.2' },
    { name: 'content-app', image: 'alfresco/alfresco-content-app:7.0.0' },
    { name: 'solr6', image: 'alfresco/alfresco-search-services:2.0.16' },
    {
      name: 'transform-core-aio',
      image: 'alfresco/alfresco-transform-core-aio:5.2.0',
    },
    { name: 'postgres', image: 'postgres:15.6' },
  ]);
  export const ALFRESCO_25_3_CONFIGURATION: ServiceConfiguration[] =
  createConfigurationFor([
    {
      name: 'alfresco',
      image: 'alfresco/alfresco-content-repository-community:25.3.0',
    },
    {
      name: 'activemq',
      image: 'alfresco/alfresco-activemq:5.18-jre17-rockylinux8',
    },
    { name: 'proxy', image: 'alfresco/alfresco-acs-nginx:3.4.2' },
    { name: 'content-app', image: 'alfresco/alfresco-content-app:7.2.0' },
    { name: 'solr6', image: 'alfresco/alfresco-search-services:2.0.17' },
    {
      name: 'transform-core-aio',
      image: 'alfresco/alfresco-transform-core-aio:5.2.2',
    },
    { name: 'postgres', image: 'postgres:15.6' },
  ]);
  export const ALFRESCO_26_1_CONFIGURATION: ServiceConfiguration[] =
  createConfigurationFor([
    {
      name: 'alfresco',
      image: 'alfresco/alfresco-content-repository-community:26.1.0',
    },
    {
      name: 'activemq',
      image: 'alfresco/alfresco-activemq:6.2.1-jre17-rockylinux8',
    },
    { name: 'proxy', image: 'alfresco/alfresco-acs-nginx:3.4.2' },
    { name: 'content-app', image: 'alfresco/alfresco-content-app:7.3.0' },
    { name: 'solr6', image: 'alfresco/alfresco-search-services:2.0.18' },
    {
      name: 'transform-core-aio',
      image: 'alfresco/alfresco-transform-core-aio:5.4.0',
    },
    { name: 'postgres', image: 'postgres:15.6' },
  ], ConfigurationMap26_1);
export const ALFRESCO_26_2_CONFIGURATION: ServiceConfiguration[] =
  createConfigurationFor([
    {
      name: 'alfresco',
      image: 'alfresco/alfresco-content-repository-community:26.2.0',
    },
    {
      name: 'activemq',
      image: 'alfresco/alfresco-activemq:6.2.6-jre17-rockylinux8',
    },
    { name: 'proxy', image: 'alfresco/alfresco-acs-nginx:3.4.2' },
    { name: 'content-app', image: 'alfresco/alfresco-content-app:8.0.0' },
    { name: 'opensearch', image: 'opensearchproject/opensearch:2.11.1' },
    {
      name: 'batch-indexer',
      image: 'alfresco/alfresco-elasticsearch-batch-indexing:5.7.0',
    },
    {
      name: 'transform-core-aio',
      image: 'alfresco/alfresco-transform-core-aio:5.4.3',
    },
    { name: 'postgres', image: 'postgres:15.6' },
  ], ConfigurationMap26_2);
export const ALFRESCO_7_3_CONFIGURATION_AARCH64: ServiceConfiguration[] =
  createConfigurationFor([
    {
      name: 'alfresco',
      image: 'angelborroy/alfresco-content-repository-community:7.3.0',
    },
    {
      name: 'activemq',
      image: 'alfresco/alfresco-activemq:5.17.1-jre11-rockylinux8',
    },
    { name: 'proxy', image: 'angelborroy/alfresco-acs-nginx:3.4.2' },
    { name: 'content-app', image: 'angelborroy/alfresco-content-app:3.1.0' },
    { name: 'solr6', image: 'angelborroy/alfresco-search-services:2.0.5.1' },
    {
      name: 'transform-core-aio',
      image: 'angelborroy/alfresco-transform-core-aio:3.0.0',
    },
    { name: 'postgres', image: 'postgres:14.4' },
  ]);
export const ALFRESCO_7_4_CONFIGURATION_AARCH64: ServiceConfiguration[] =
  createConfigurationFor([
    {
      name: 'alfresco',
      image: 'alfresco/alfresco-content-repository-community:7.4.0.1',
    },
    {
      name: 'activemq',
      image: 'alfresco/alfresco-activemq:5.17.1-jre11-rockylinux8',
    },
    { name: 'proxy', image: 'angelborroy/alfresco-acs-nginx:3.4.2' },
    { name: 'content-app', image: 'angelborroy/alfresco-content-app:4.0.0' },
    { name: 'solr6', image: 'angelborroy/alfresco-search-services:2.0.7' },
    {
      name: 'transform-core-aio',
      image: 'angelborroy/alfresco-transform-core-aio:3.1.0',
    },
    { name: 'postgres', image: 'postgres:14.4' },
  ]);  
