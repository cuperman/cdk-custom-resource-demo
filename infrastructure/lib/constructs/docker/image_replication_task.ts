import * as path from "path";

import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as cfn from "@aws-cdk/aws-cloudformation";
import * as iam from "@aws-cdk/aws-iam";

import { ImageReplicator } from "./image_replicator";
import {
  Registry,
  EcrDockerRegistry,
  StandardDockerRegistry,
} from "./registry";

export interface ImageReplicationTaskProps {
  readonly replicator: ImageReplicator;
  readonly source: Registry;
  readonly target: Registry;
  readonly image: string;
}

export class ImageReplicationTask extends cdk.Construct {
  public replicationHandler: lambda.IFunction;
  public replicationResource: cfn.CustomResource;

  constructor(
    scope: cdk.Construct,
    id: string,
    props: ImageReplicationTaskProps
  ) {
    super(scope, id);

    const { replicator, source, target, image } = props;

    this.replicationHandler = new lambda.SingletonFunction(
      this,
      "ReplicationHandler",
      {
        uuid: "f7ef4f95-4962-407f-af2c-41680ca9b0b4",
        runtime: lambda.Runtime.NODEJS_12_X,
        code: lambda.Code.fromAsset(
          path.join(__dirname, "../../../../assets/lambda/replicate-image")
        ),
        handler: "index.handler",
        timeout: cdk.Duration.minutes(15),
        initialPolicy: [
          new iam.PolicyStatement({
            actions: ["codebuild:StartBuild", "codebuild:BatchGetBuilds"],
            resources: [replicator.projectArn],
          }),
        ],
      }
    );

    this.replicationResource = new cfn.CustomResource(
      this,
      "ReplicationResource",
      {
        provider: cfn.CustomResourceProvider.fromLambda(
          this.replicationHandler
        ),
        resourceType: "Custom::ImageReplicationTask",
        properties: {
          ReplicatorProjectName: replicator.projectName,
          SourceRegistry: source.properties(),
          TargetRegistry: target.properties(),
          ImageName: image,
        },
      }
    );

    // set dependencies and grant access
    [source, target].forEach((registry) => {
      if (registry instanceof EcrDockerRegistry) {
        this.node.addDependency(registry.repository);
        registry.repository.grantPullPush(replicator);
      }

      if (registry instanceof StandardDockerRegistry) {
        replicator.addToRolePolicy(
          new iam.PolicyStatement({
            actions: ["secretsmanager:GetSecretValue"],
            resources: [registry.usernameArn(), registry.passwordArn()],
          })
        );
      }
    });
  }
}
