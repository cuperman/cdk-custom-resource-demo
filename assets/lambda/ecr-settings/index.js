const AWS = require("aws-sdk");

const ecr = new AWS.ECR();

const DEFAULT_SCAN_ON_PUSH = false;
const DEFAULT_TAG_IMMUTABILITY = false;

function parseBoolean(value) {
  return value === "true";
}

/*
 * event:
 *   ResourceProperties:
 *     RepositoryName: string
 *     ScanOnPush: boolean as string
 *     TagImmutability: boolean as string
 */
async function onCreate(event) {
  console.log("onCreate", event);

  const props = event.ResourceProperties;

  const repositoryName = props.RepositoryName;
  const scanOnPush = parseBoolean(props.ScanOnPush);
  const tagImmutability = parseBoolean(props.TagImmutability);

  // on create, update the settings if the value differs from the default
  if (scanOnPush !== DEFAULT_SCAN_ON_PUSH) {
    const scanOnPushResponse = await ecr
      .putImageScanningConfiguration({
        repositoryName: repositoryName,
        imageScanningConfiguration: {
          scanOnPush: scanOnPush,
        },
      })
      .promise();

    console.log("scanOnPushResponse", scanOnPushResponse);
  }

  // on create, update the settings if the value differs from the default
  if (tagImmutability !== DEFAULT_TAG_IMMUTABILITY) {
    const tagImmutabilityResponse = await ecr
      .putImageTagMutability({
        repositoryName: repositoryName,
        imageTagMutability: tagImmutability ? "IMMUTABLE" : "MUTABLE",
      })
      .promise();

    console.log("tagImmutabilityResponse", tagImmutabilityResponse);
  }

  return {
    PhysicalResourceId: repositoryName,
  };
}
exports.onCreate = onCreate;

async function onUpdate(event) {
  console.log("onUpdate", event);

  const props = event.ResourceProperties;
  const oldProps = event.OldResourceProperties;

  const repositoryName = props.RepositoryName;
  const scanOnPush = parseBoolean(props.ScanOnPush);
  const tagImmutability = parseBoolean(props.TagImmutability);

  // on update, update the settings if the value differs from previous value or if the repository changes
  if (
    scanOnPush !== parseBoolean(oldProps.ScanOnPush) ||
    repositoryName !== oldProps.RepositoryName
  ) {
    const scanOnPushResponse = await ecr
      .putImageScanningConfiguration({
        repositoryName: repositoryName,
        imageScanningConfiguration: {
          scanOnPush: scanOnPush,
        },
      })
      .promise();

    console.log("scanOnPushResponse", scanOnPushResponse);
  }

  // on update, update the settings if the value differs from previous value or if the repository changes
  if (
    tagImmutability !== parseBoolean(oldProps.TagImmutability) ||
    repositoryName !== oldProps.RepositoryName
  ) {
    const tagImmutabilityResponse = await ecr
      .putImageTagMutability({
        repositoryName: repositoryName,
        imageTagMutability: tagImmutability ? "IMMUTABLE" : "MUTABLE",
      })
      .promise();

    console.log("tagImmutabilityResponse", tagImmutabilityResponse);
  }

  return {
    PhysicalResourceId: repositoryName,
  };
}
exports.onUpdate = onUpdate;

async function onDelete(event) {
  console.log("onDelete", event);

  const props = event.ResourceProperties;

  const repositoryName = props.RepositoryName;

  // on delete, always restore default value
  const scanOnPushResponse = await ecr
    .putImageScanningConfiguration({
      repositoryName: repositoryName,
      imageScanningConfiguration: {
        scanOnPush: DEFAULT_SCAN_ON_PUSH,
      },
    })
    .promise();

  console.log("scanOnPushResponse", scanOnPushResponse);

  // on delete, always restore default value
  const tagImmutabilityResponse = await ecr
    .putImageTagMutability({
      repositoryName: repositoryName,
      imageTagMutability: DEFAULT_TAG_IMMUTABILITY ? "IMMUTABLE" : "MUTABLE",
    })
    .promise();

  console.log("tagImmutabilityResponse", tagImmutabilityResponse);

  return {
    PhysicalResourceId: repositoryName,
  };
}
exports.onDelete = onDelete;

async function onEvent(event) {
  console.log("event", event);

  const requestType = event["RequestType"];
  switch (requestType) {
    case "Create":
      return onCreate(event);
    case "Update":
      return onUpdate(event);
    case "Delete":
      return onDelete(event);
    default:
      throw new Error(`Invalid request type: "${requestType}"`);
  }
}
exports.onEvent = onEvent;
