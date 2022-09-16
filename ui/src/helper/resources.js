export const resources = {
    HOME : {
              TITLE : "Alfresco Content Service (ACS) deployment tool",
              RAM_ALERT_TITLE : "Not enough RAM available!",
              RAM_ALERT_MESSAGE : "Despite ACS may work with less than 10 GB RAM, it's recommended to use at least this amount of RAM. Review Docker Desktop configuration to increase this resource.",
              RAM_AVAILABLE_MESSAGE : "Currently RAM allocated for docker in GB is ",
            },
    CREATE : {
              RUNNING : "Running...",
              STOPPING : "Stopping...",
              ERROR: "ERROR",
            },
    LIST : {
              IMAGE : "IMAGE",
              VERSION  : "VERSION",
              NAME  : "NAME",
              STATUS  : "STATUS",
              DETAILS : "",
              START : "START",
              ALFRESCO_READY_TITLE : "Alfresco is Ready!",
              ALFRESCO_READY_MESSAGE: "Click START button and use default credentials admin/admin",
              ALFRESCO_STARTING_TITLE : "Alfresco is starting",
              ALFRESCO_STARTING_MESSAGE : "Wait a few minutes till Alfresco is ready. You may use the Refresh button to update status.",
              ALFRESCO_CONTAINERS_LIST_ERROR : "At least one of the containers was unable to run. In the above list is identified with Status EXITED. Please review the details of the error in the container before trying again."
            },
  }