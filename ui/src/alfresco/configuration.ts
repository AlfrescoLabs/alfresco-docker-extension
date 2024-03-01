import { ServiceConfiguration } from './types';

export const RAM_LIMIT = 10;

type option = {
  name: string;
  image: string;
};

function createConfigurationFor(components: option[]): ServiceConfiguration[] {
  return components.map(({ name, image }) => ConfigurationMap[name](image));
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
        'JAVA_OPTS="-Ddb.driver=org.postgresql.Driver -Ddb.username=alfresco -Ddb.password=alfresco -Ddb.url=jdbc:postgresql://postgres:5432/alfresco -Dsolr.host=solr6 -Dsolr.port=8983 -Dsolr.http.connection.timeout=1000 -Dsolr.secureComms=secret -Dsolr.sharedSecret=secret -Dsolr.base.url=/solr -Dindex.subsystem.name=solr6 -Dshare.host=127.0.0.1 -Dshare.port=8080 -Dalfresco.host=localhost -Dalfresco.port=8080 -Daos.baseUrlOverwrite=http://localhost:8080/alfresco/aos -Dmessaging.broker.url=\'failover:(nio://activemq:61616)?timeout=3000&jms.useCompression=true\' -Ddeployment.method=DOCKER_COMPOSE -DlocalTransform.core-aio.url=http://transform-core-aio:8090/ -Dcsrf.filter.enabled=false -XX:MinRAMPercentage=50 -XX:MaxRAMPercentage=80"',
      ],
      cmd: '',
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
  }),
  activemq: (image: string) => ({
    service: 'activemq',
    image,
    run: {
      options: ['--memory', '768m', '-p', '8161:8161'],
      cmd: '',
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
        '-p',
        '8083:8983',
      ],
      cmd: '',
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
      order: 4,
    },
  }),
  'content-app': (image: string) => ({
    service: 'content-app',
    image,
    run: {
      options: ['--memory', '256m'],
      cmd: '',
      order: 1,
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
      image: 'alfresco/alfresco-content-repository-community:23.2.0',
    },
    {
      name: 'activemq',
      image: 'alfresco/alfresco-activemq:5.18-jre17-rockylinux8',
    },
    { name: 'proxy', image: 'alfresco/alfresco-acs-nginx:3.4.2' },
    { name: 'content-app', image: 'alfresco/alfresco-content-app:4.3.0' },
    { name: 'solr6', image: 'alfresco/alfresco-search-services:2.0.9.1' },
    {
      name: 'transform-core-aio',
      image: 'alfresco/alfresco-transform-core-aio:5.0.1',
    },
    { name: 'postgres', image: 'postgres:15.6' },
  ]);    
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
