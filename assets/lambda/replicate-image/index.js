const CodeBuild = require("aws-sdk/clients/codebuild");
const cfnResponse = require("./custom_cfn_response");

const RETRY_INTERVAL = 5000; // 5 seconds

async function onEvent(event) {
  console.log("onEvent", event);

  if (!["Create", "Update"].includes(event.RequestType)) {
    // nothing to do
    return { BuildStarted: false };
  }

  const codebuild = new CodeBuild();
  const props = event.ResourceProperties;

  const environment = [
    { name: "SOURCE_TYPE", value: props.SourceRegistry.Type },
    { name: "SOURCE_DOMAIN", value: props.SourceRegistry.Domain },
    { name: "TARGET_TYPE", value: props.TargetRegistry.Type },
    { name: "TARGET_DOMAIN", value: props.TargetRegistry.Domain },
    { name: "IMAGE_NAME", value: props.ImageName },
  ];

  if (props.SourceRegistry.UsernameId) {
    environment.push({
      name: "SOURCE_USERNAME",
      value: props.SourceRegistry.UsernameId,
      type: "SECRETS_MANAGER",
    });
  }

  if (props.SourceRegistry.PasswordId) {
    environment.push({
      name: "SOURCE_PASSWORD",
      value: props.SourceRegistry.PasswordId,
      type: "SECRETS_MANAGER",
    });
  }

  if (props.TargetRegistry.UsernameId) {
    environment.push({
      name: "TARGET_USERNAME",
      value: props.TargetRegistry.UsernameId,
      type: "SECRETS_MANAGER",
    });
  }

  if (props.TargetRegistry.PasswordId) {
    environment.push({
      name: "TARGET_PASSWORD",
      value: props.TargetRegistry.PasswordId,
      type: "SECRETS_MANAGER",
    });
  }

  const response = await codebuild
    .startBuild({
      projectName: props.ReplicatorProjectName,
      environmentVariablesOverride: environment,
    })
    .promise();

  console.log("start build response", JSON.stringify(response));

  return {
    BuildStarted: true,
    StartBuildResponse: response,
  };
}
exports.onEvent = onEvent;

async function isComplete(event) {
  console.log("isComplete", event);

  if (!event.BuildStarted) {
    console.log("there is no build response to monitor; just return complete");
    return { IsComplete: true };
  }

  const codebuild = new CodeBuild();
  const buildId = event.StartBuildResponse.build.id;
  const response = await codebuild.batchGetBuilds({ ids: [buildId] }).promise();
  const build = response.builds[0];

  console.log("build status response", JSON.stringify(build));

  if (typeof build === "undefined" || build.id !== buildId) {
    throw new Error(`Unable to find replication task id '${buildId}'`);
  }

  if (build.buildStatus === "IN_PROGRESS") {
    console.log("not done yet");
    return { IsComplete: false };
  }

  if (build.buildStatus === "FAILED") {
    throw new Error("Failed to replicate image");
  }

  console.log("all done with no errors");
  return { IsComplete: true };
}
exports.isComplete = isComplete;

async function checkIsComplete(event, context) {
  console.log("checkIsComplete", event);

  const isCompleteResponse = await isComplete(event, context);
  console.log("isComplete response", isCompleteResponse);

  if (isCompleteResponse.IsComplete) {
    console.log("complete!");
    return;
  } else if (context.getRemainingTimeInMillis() < RETRY_INTERVAL * 2) {
    console.error("operation timed out");
    throw new Error("operation timed out");
  } else {
    console.log("incomplete; try again");
    return new Promise((resolve, reject) => {
      setTimeout(
        () => checkIsComplete(event, context).then(resolve).catch(reject),
        RETRY_INTERVAL
      );
    });
  }
}

function handler(event, context) {
  console.log("handler event", event);
  console.log("handler context", context);

  const props = event.ResourceProperties;
  const physicalId = props.ImageName;

  const sendSuccess = (data) => {
    console.log("success", data);
    cfnResponse.send(event, context, cfnResponse.SUCCESS, {
      physicalResourceId: physicalId,
    });
  };

  const sendFailure = (error) => {
    console.error("error", error);
    cfnResponse.send(event, context, cfnResponse.FAILED, {
      physicalResourceId: physicalId,
      reason: error && error.message,
    });
  };

  onEvent(event, context)
    .then((onEventResponse) => {
      console.log("onEvent response", onEventResponse);
      return checkIsComplete({ ...event, ...onEventResponse }, context).then(
        sendSuccess
      );
    })
    .catch(sendFailure);
}
exports.handler = handler;
