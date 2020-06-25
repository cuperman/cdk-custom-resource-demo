# Design

## Image Replication

```yuml
// {type:usecase}
// {direction:leftToRight}
// {generate:true}

[Developer]-(Push Image)
(Push Image)>(Central Registry)
[Developer]-(CDK Deploy)
(CDK Deploy)>(Repository)
(CDK Deploy)>(Image Replicator)
(CDK Deploy)>(Replicate Image)
(Replicate Image)-(note: Copy image from central repo to ECR repo)
(CDK Deploy)>(Task Definition)
```