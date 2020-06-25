#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { FargateExampleStack } from "../lib/fargate-example-stack";

const app = new cdk.App();
new FargateExampleStack(app, "FargateExample", {
  env: {
    account: "588611805875",
    region: "us-east-1",
  },
  vpcConfig: {
    vpcName: "MeetupNetwork/VPC",
  },
  registryConfig: {
    domain: "docker.pkg.github.com",
    usernameId: "cuperman/docker/github:username",
    passwordId: "cuperman/docker/github:password",
  },
  image: "cuperman/cdk-custom-resource-demo/helloworld:latest",
});
