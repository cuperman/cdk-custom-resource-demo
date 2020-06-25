import * as cdk from "@aws-cdk/core";
import * as ecr from "@aws-cdk/aws-ecr";

/*
 * Secrets in Secrets Manager
 * usernameId and passwordId: strings in the format of "secret-id:json-key", where
 *   - secret-id: The name or Amazon Resource Name (ARN) that serves as a unique identifier for the secret
 *   - json-key: Specifies the key name of the key-value pair whose value you want to retrieve
 */
export interface RegistryConfigProps {
  readonly domain: string;
  readonly usernameId: string;
  readonly passwordId: string;
}

export interface RegistryCfnProperties {
  readonly Type: "STANDARD" | "ECR";
  readonly Domain: string;
  readonly UsernameId?: string;
  readonly PasswordId?: string;
}

export abstract class Registry {
  public static fromConfig(props: RegistryConfigProps): Registry {
    return new StandardDockerRegistry(props);
  }

  public static fromEcrRepository(repository: ecr.IRepository): Registry {
    return new EcrDockerRegistry(repository);
  }

  public abstract get domain(): string;

  public abstract properties(): RegistryCfnProperties;
}

export class StandardDockerRegistry extends Registry {
  private readonly props: RegistryConfigProps;

  constructor(props: RegistryConfigProps) {
    super();
    this.props = props;
  }

  public get domain(): string {
    return this.props.domain;
  }

  private secretsManagerIdToArn(id: string): string {
    const nameOrArn = id.substr(0, id.lastIndexOf(":"));
    if (nameOrArn.startsWith("arn")) {
      return nameOrArn;
    } else {
      return `arn:aws:secretsmanager:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:secret:${nameOrArn}-??????`;
    }
  }

  public usernameArn(): string {
    return this.secretsManagerIdToArn(this.props.usernameId);
  }

  public passwordArn(): string {
    return this.secretsManagerIdToArn(this.props.passwordId);
  }

  public properties(): RegistryCfnProperties {
    return {
      Type: "STANDARD",
      Domain: this.domain,
      UsernameId: this.props.usernameId,
      PasswordId: this.props.passwordId,
    };
  }
}

export class EcrDockerRegistry extends Registry {
  public readonly repository: ecr.IRepository;

  constructor(repository: ecr.IRepository) {
    super();
    this.repository = repository;
  }

  public get domain(): string {
    return this.repository.repositoryUri.split("/")[0];
  }

  public properties(): RegistryCfnProperties {
    return {
      Type: "ECR",
      Domain: this.domain,
    };
  }
}
