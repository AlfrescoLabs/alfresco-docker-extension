FROM node:18.18-alpine3.18 AS client-builder
WORKDIR /ui
# cache packages in layer
COPY ui/package.json /ui/package.json
COPY ui/package-lock.json /ui/package-lock.json
RUN --mount=type=cache,target=/usr/src/app/.npm \
    npm set cache /usr/src/app/.npm && \
    npm ci
# install
COPY ui /ui
RUN npm run build

FROM alpine
LABEL org.opencontainers.image.title="Alfresco Community" \
    org.opencontainers.image.description="Alfresco Docker Extension" \
    org.opencontainers.image.vendor="Hyland" \
    com.docker.desktop.extension.api.version=">= 0.2.3" \
    com.docker.desktop.extension.icon="https://raw.githubusercontent.com/AlfrescoLabs/alfresco-docker-extension/main/alfresco.svg" \
    com.docker.extension.categories="cloud-deployment" \
    com.docker.extension.screenshots="[ \
        {\"alt\": \"Home page - list of Alfresco Docker Images\", \"url\": \"https://raw.githubusercontent.com/AlfrescoLabs/alfresco-docker-extension/main//docs/images/1-initial.png\"}, \
        {\"alt\": \"Setup - download Alfresco Docker Images\", \"url\": \"https://raw.githubusercontent.com/AlfrescoLabs/alfresco-docker-extension/main//docs/images/2-setup.png\"}, \
        {\"alt\": \"Run - Alfresco Docker Images downloaded\", \"url\": \"https://raw.githubusercontent.com/AlfrescoLabs/alfresco-docker-extension/main//docs/images/3-run.png\"}, \
        {\"alt\": \"Starting Alfresco Containers\", \"url\": \"https://raw.githubusercontent.com/AlfrescoLabs/alfresco-docker-extension/main//docs/images/4-starting.png\"}, \
        {\"alt\": \"Alfresco is Ready, click Open\", \"url\": \"https://raw.githubusercontent.com/AlfrescoLabs/alfresco-docker-extension/main//docs/images/5-ready.png\"}, \
        {\"alt\": \"Alfresco UI opened in the browser\", \"url\": \"https://raw.githubusercontent.com/AlfrescoLabs/alfresco-docker-extension/main//docs/images/6-alfresco-browser.png\"}, \
        {\"alt\": \"Stopping Alfresco Containers (back to initial status)\", \"url\": \"https://raw.githubusercontent.com/AlfrescoLabs/alfresco-docker-extension/main//docs/images/7-stopping.png\"} \
    ]" \
    com.docker.extension.detailed-description="<p>With Alfresco Docker Extension you can easily deploy Alfresco using Docker Containers.</p> \
    <h2 id="-features">✨ What can you do with this extension?</h2> \
    <ul> \
    <li>Pull latest Alfresco Docker Images</li> \
    <li>Run Alfresco Docker Containers</li> \
    <li>Use Alfresco deployment locally in your browser</li> \
    <li>Stop deployment and recover your system to initial status</li> \
    </ul> \
    "\
    com.docker.extension.publisher-url="https://www.alfresco.com/" \
    com.docker.extension.additional-urls="[ \
        {\"title\":\"Support\", \"url\":\"https://github.com/AlfrescoLabs/alfresco-docker-extension/issues\"} \
    ]" \
    com.docker.extension.changelog="<ul>\
    <li>Allowing to run the extension without 'Show Docker Extensions system containers' option checked.</li> \
    </ul>"

COPY docker-compose.yaml .
COPY metadata.json .
COPY alfresco.svg .
COPY --from=client-builder /ui/build ui
ENTRYPOINT ["/bin/sh","-c","sleep infinity"]