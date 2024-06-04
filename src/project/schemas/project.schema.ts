import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from 'src/database/abstract.schema';
import { randomUUID } from 'crypto';

@Schema({ versionKey: false })
export class Project extends AbstractDocument {
  @Prop({ default: null })
  projectId: string;

  @Prop({ required: true })
  projectName: string;

  @Prop({ required: true })
  projectDescription: string;

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
