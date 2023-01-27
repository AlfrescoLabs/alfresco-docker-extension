FROM node:18.9-alpine3.15 AS client-builder
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

FROM alpine:3.15
LABEL org.opencontainers.image.title="Alfresco Community" \
    org.opencontainers.image.description="Alfresco Docker Extension" \
    org.opencontainers.image.vendor="Hyland" \
    com.docker.desktop.extension.api.version=">= 0.2.3" \
    com.docker.extension.screenshots="" \
    com.docker.extension.detailed-description="" \
    com.docker.extension.publisher-url="" \
    com.docker.desktop.extension.icon="https://raw.githubusercontent.com/AlfrescoLabs/alfresco-docker-extension/main/alfresco.svg" \
    com.docker.extension.additional-urls="" \
    com.docker.extension.changelog="" \
    com.docker.extension.categories="cloud-deployment"

COPY docker-compose.yaml .
COPY metadata.json .
COPY alfresco.svg .
COPY --from=client-builder /ui/build ui
ENTRYPOINT ["/bin/sh","-c","sleep infinity"]
