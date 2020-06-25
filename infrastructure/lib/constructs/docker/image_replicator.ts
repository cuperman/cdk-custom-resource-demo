import * as fs from "fs";
import * as path from "path";

import * as cdk from "@aws-cdk/core";
import * as codebuild from "@aws-cdk/aws-codebuild";

import { ImageReplicationTask } from "./image_replication_task";
import { Registry } from "./registry";

export interface ReplicateImageProps {
  readonly source: Registry;
  readonly target: Registry;
  readonly image: string;
}

export class ImageReplicator extends codebuild.Project {
  public replicationTasks: ImageReplicationTask[];

  constructor(
    scope: cdk.Construct,
    id: string,
    props?: codebuild.ProjectProps
  ) {
    const replicateImage = fs
      .readFileSync(
        path.join(__dirname, "../../../../assets/codebuild/replicate-image.sh")
      )
      .toString("utf8");

    super(scope, id, {
      environment: {
        buildImage: codebuild.LinuxBuildImage.fromCodeBuildImageId(
          "aws/codebuild/amazonlinux2-x86_64-standard:3.0"
        ),
        privileged: true,
      },
      environmentVariables: {
        SOURCE_TYPE: { value: "" },
        SOURCE_DOMAIN: { value: "" },
        SOURCE_USERNAME: { value: "" },
        SOURCE_PASSWORD: { value: "" },
        TARGET_TYPE: { value: "" },
        TARGET_DOMAIN: { value: "" },
        TARGET_USERNAME: { value: "" },
        TARGET_PASSWORD: { value: "" },
        IMAGE_NAME: { value: "" },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: "0.2",
        phases: {
          build: {
            commands: [replicateImage],
          },
        },
      }),
    });

    this.replicationTasks = [];
  }

  public replicateImage(props: ReplicateImageProps): ImageReplicationTask {
    const { source, target, image } = props;
    const index = this.replicationTasks.length + 1;

    const task = new ImageReplicationTask(this, `ReplicateImage-${index}`, {
      replicator: this,
      source,
      target,
      image,
    });

    this.replicationTasks.push(task);

    return task;
  }
}
