import * as path from "path";
import * as cdk from "@aws-cdk/core";
import * as ecr from "@aws-cdk/aws-ecr";
import * as lambda from "@aws-cdk/aws-lambda";
import * as cr from "@aws-cdk/custom-resources";
import * as iam from "@aws-cdk/aws-iam";

export interface EcrSettingsProps {
  readonly ecrRepository: ecr.IRepository;
  readonly scanOnPush?: boolean;
  readonly tagImmutability?: boolean;
}

export class EcrSettings extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: EcrSettingsProps) {
    super(scope, id);

    const onEventHandler = new lambda.Function(this, "OnEventHandler", {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.asset(
        path.join(__dirname, "../../../assets/lambda/ecr-settings")
      ),
      handler: "index.onEvent",
      timeout: cdk.Duration.minutes(1),
      initialPolicy: [
        new iam.PolicyStatement({
          actions: [
            "ecr:PutImageScanningConfiguration",
            "ecr:PutImageTagMutability",
          ],
          resources: [
            // need access to modify any repos in this region because the repository name can change
            `arn:aws:ecr:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:repository/*`,
          ],
        }),
      ],
    });

    const provider = new cr.Provider(this, "Provider", {
      onEventHandler: onEventHandler,
    });

    const customResource = new cdk.CustomResource(this, "CustomResource", {
      resourceType: "Custom::RepositorySettings",
      serviceToken: provider.serviceToken,
      properties: {
        RepositoryName: props.ecrRepository.repositoryName,
        ScanOnPush: !!props.scanOnPush,
        TagImmutability: !!props.tagImmutability,
      },
    });

    customResource.node.addDependency(props.ecrRepository);
  }
}
