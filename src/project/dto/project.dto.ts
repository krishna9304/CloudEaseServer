import { IsArray, IsEmpty, IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

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

  @IsArray()
  tags: Array<string>;

  @IsEmpty()
  created_at: number;

  @IsEmpty()
  updated_at: number;

  @IsEmpty()
  metadata: any;
}
