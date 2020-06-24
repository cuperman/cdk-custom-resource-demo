import * as cdk from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecr from "@aws-cdk/aws-ecr";
import * as ecs from "@aws-cdk/aws-ecs";
import * as ecsPatterns from "@aws-cdk/aws-ecs-patterns";

export interface FargateExampleStackProps extends cdk.StackProps {
  readonly vpcConfig: ec2.VpcLookupOptions;
  readonly image: string; // ex: namespace/foobar:latest
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
