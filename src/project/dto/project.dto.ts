import {
  IsArray,
  IsEmpty,
  IsEnum,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { Types } from 'mongoose';
import {
  AwsDetails,
  AzureDetails,
  CloudProvider,
} from '../schemas/project.schema';

export class ProjectDto {
  @IsEmpty()
  _id: Types.ObjectId;

  @IsEmpty()
  projectId: string;

  @IsEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  projectName: string;

  @IsString()
  @IsNotEmpty()
  projectDescription: string;

  @IsString()
  @IsEnum(['azure', 'aws'])
  cloudProvider: CloudProvider;

  azureDetails: AzureDetails;

  awsDetails: AwsDetails;

  @IsArray()
  tags: Array<string>;

  @IsEmpty()
  created_at: number;

  @IsEmpty()
  updated_at: number;

  @IsEmpty()
  metadata: any;
}
