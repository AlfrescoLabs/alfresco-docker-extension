# Alfresco Extension for Docker Desktop

Experimental Docker Extension to deploy Alfresco Stack using the Docker Desktop interface

The extension can be installed using following command (with Extensions enabled in Docker Desktop):

```sh
docker extension install angelborroy/alfresco-extension
```

Following instructions are only required to build and develop the extension.

## Prerequisites

Runtime Requirements:

- [Docker Desktop 4.8.0 or later](https://www.docker.com/products/docker-desktop/) with Docker Extensions enabled

Development Recommendations:

- [React reference](https://reactjs.org)
- [Docker Extensions CLI](https://github.com/docker/extensions-sdk)

## Enable Docker Extensions

In Docker Desktop, go to `Preferences > Extensions` and check `Enable Docker Extensions` and `Show Docker Extensions system containers` options

>> It's not required to enable the option `Show Docker Extensions system containers`. But without it, navigation to Container Detail (the (i) icon to the left of every container) is not available.

## Running the extension

Since this Docker Extensions hasn't been yet published, it's required to build and deploy it locally from source code.

Make sure that [Docker Desktop](https://www.docker.com/products/docker-desktop/) is running in the background.

Then run the following command to build and install the local extension:

```sh
make install-extension
```

> **Note** if the installation is not successful with the Error message `mounts denied: the path /run/guest-services/... is not shared from OS X` check that "User gRPC FUSE file sharing" option is enable in Docker general settings.

## Using the Extension

From the Docker Dashboard you can now navigate to the Extensions section.

It should now list **Alfresco** as one of the available extensions.

Click on **Run** button to run **Alfresco** in Docker and once the deployment is ready click on **Open** button to start ACS in your browser.

If you want to un-deploy Alfresco, click **Stop** button.

## Quick notes to get started with Development

To view the Devtools while developing an extension run: `docker extension dev debug angelborroy/alfresco-extension`

To get started in developer mode with hot reloading:

Open two terminals:

1. `npm run start` from inside the `ui` folder
2. `docker extension dev ui-source angelborroy/alfresco-extension http://localhost:3000`

Now launching the extension on docker dashboard will open DevTools for logs and any change will be hot reloaded in the UI.

> **Note** when a new build of the extension is needed don't run `docker extension install` again, otherwise the cli will reply with an error. run `docker extension update` instead.

## Publishing the extension

Before publishing the extension, create a git tag with the number of the release.

```
git tag 1.0.0
```

Once the tag is applied, run following commands to push the Docker Image to Docker Hub (using the tag name as TAG parameter for `make`)

```
make prepare-buildx
make push-extension TAG=1.0.0
```