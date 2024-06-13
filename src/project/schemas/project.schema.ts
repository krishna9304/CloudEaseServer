import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from 'src/database/abstract.schema';
import { randomUUID } from 'crypto';

export type AzureDetails = {
  clientId: string;
  clientSecret: string;
  subscriptionId: string;
  tenantId: string;
  accessKey: string;
  region: string;
  backendResourceGroup: string;
  backendStorageAccount: string;
  backendContainer: string;
  backendKey: string;
};

export type AwsDetails = {
  accessKey: string;
  secretKey: string;
  region: string;
};

export enum CloudProvider {
  Azure = 'azure',
  Aws = 'aws',
}

@Schema({ versionKey: false })
export class Project extends AbstractDocument {
  @Prop({ default: null })
  projectId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  projectName: string;

  @Prop({ required: true })
  projectDescription: string;

  @Prop({ default: 'azure' })
  cloudProvider: CloudProvider;

  @Prop({ default: null, type: Object })
  azureDetails: AzureDetails;

  @Prop({ default: null, type: Object })
  awsDetails: AwsDetails;

  @Prop({ default: [] })
  tags: Array<string>;

  @Prop({ default: null })
  created_at: number;

  @Prop({ default: null })
  updated_at: number;

  @Prop({ default: null, type: Object })
  metadata: any;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

ProjectSchema.pre('save', function (next) {
  this.projectId = `project-${randomUUID().slice(0, 8)}`;
  this.created_at = Date.now();
  this.updated_at = Date.now();
  next();
});
