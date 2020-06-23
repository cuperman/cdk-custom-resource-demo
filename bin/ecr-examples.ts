#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { EcrExamplesStack } from '../lib/ecr-examples-stack';

const app = new cdk.App();
new EcrExamplesStack(app, 'EcrExamplesStack');
