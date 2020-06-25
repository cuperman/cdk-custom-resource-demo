# Custom constructs in CDK

Sometimes there are AWS features you want to use that are not available in CDK.  There are a few options...

## Use L1 constructs /  low-level constructs

The low-level constructs are the ones that start with `Cfn`, and are one-to-one mappings of CloudFormation spec. The CDK team releases frequently, and is usually only up to a week behind CloudFormation spec in the latest version of low-level constructs.

See here for more info:
[https://docs.aws.amazon.com/cdk/latest/guide/constructs.html](https://docs.aws.amazon.com/cdk/latest/guide/constructs.html)

## Escape hatches

Sometimes switching to low-level constructs would require major refactoring, and you just need the ability to access some properties of CloudFormation spec.  In this cases, look to escape hatches.  This allows you to override the properties of the underlying resource of a high-level construct.

A common use case is to override properties:

```ts
const bucket = new s3.Bucket(this, 'MyBucket');

const cfnBucket = bucket.node.defaultChild as s3.CfnBucket;
cfnBucket.addPropertyOverride('VersioningConfiguration.Status', 'NewStatus');
```

But there are more things you can do:
[https://docs.aws.amazon.com/cdk/latest/guide/cfn_layer.html](https://docs.aws.amazon.com/cdk/latest/guide/cfn_layer.html)

## Custom Resources

Using low-level constructs and escape hatches only work if CloudFormation supports the feature you are looking to use.  In the case that you're looking to use a feature that is not supported by CloudFormation, you can write a custom resource.

This repo has examples of writing custom resources using CDK.

Reference:
[https://docs.aws.amazon.com/cdk/api/latest/docs/custom-resources-readme.html](https://docs.aws.amazon.com/cdk/api/latest/docs/custom-resources-readme.html)
