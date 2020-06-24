import { expect as expectCDK, haveResource } from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import { FargateExampleStack } from "../lib/fargate-example-stack";

describe("FargateExampleStack", () => {
  const app = new cdk.App();

  const stack = new FargateExampleStack(app, "FargateExample", {
    env: {
      account: "123456789012",
      region: "us-east-1",
    },
    vpcConfig: {
      vpcName: "DUMMY",
    },
    image: "helloworld:latest",
  });

  it("has a repository", () => {
    expectCDK(stack).to(haveResource("AWS::ECR::Repository"));
  });

  it("has a fargate service", () => {
    expectCDK(stack).to(haveResource("AWS::ECS::Service"));
  });
});
