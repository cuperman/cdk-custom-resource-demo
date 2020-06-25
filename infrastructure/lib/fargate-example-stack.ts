import * as cdk from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecr from "@aws-cdk/aws-ecr";
import * as ecs from "@aws-cdk/aws-ecs";
import * as ecsPatterns from "@aws-cdk/aws-ecs-patterns";

import * as ecrSettings from "./constructs/ecr-settings";
import * as docker from "./constructs/docker";
import { Registry } from "./constructs/docker";

export interface FargateExampleStackProps extends cdk.StackProps {
  readonly vpcConfig: ec2.VpcLookupOptions;
  readonly image: string; // ex: namespace/foobar:latest
  readonly registryConfig: docker.RegistryConfigProps;
}

export class FargateExampleStack extends cdk.Stack {
  constructor(
    scope: cdk.Construct,
    id: string,
    props: FargateExampleStackProps
  ) {
    super(scope, id, props);

    const [imageName, imageTag] = props.image.split(":");

    const vpc = ec2.Vpc.fromLookup(this, "Vpc", props.vpcConfig);

    const repo = new ecr.Repository(this, "Repository", {
      repositoryName: `${imageName}`,
    });

    new ecrSettings.EcrSettings(this, "RepositorySettings", {
      ecrRepository: repo,
      scanOnPush: true,
      tagImmutability: true,
    });

    const centralRegistry = docker.Registry.fromConfig(props.registryConfig);

    const imageReplicator = new docker.ImageReplicator(this, "ImageReplicator");

    imageReplicator.replicateImage({
      source: centralRegistry,
      target: Registry.fromEcrRepository(repo),
      image: props.image,
    });

    const containerImage = ecs.ContainerImage.fromEcrRepository(repo, imageTag);

    const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(
      this,
      "Service",
      {
        vpc,
        taskImageOptions: {
          image: containerImage,
        },
      }
    );

    new cdk.CfnOutput(this, "LoadBalancerDomainName", {
      value: fargateService.loadBalancer.loadBalancerDnsName,
    });
  }
}
