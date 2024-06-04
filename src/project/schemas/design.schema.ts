import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from 'src/database/abstract.schema';
import { randomUUID } from 'crypto';

export interface CanvasNode {
  id: string;
  type: string;
  resourceName: string;
  position: {
    x: number;
    y: number;
  };
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
}

export interface CanvasComponents {
  nodes: Array<CanvasNode>;
  edges: Array<CanvasEdge>;
}

@Schema({ versionKey: false })
export class Design extends AbstractDocument {
  @Prop({ default: null })
  designId: string;

  @Prop({ required: true })
  projectId: string;

  @Prop({ default: { nodes: [], edges: [] }, type: Object })
  components: CanvasComponents;

  @Prop({ default: null })
  created_at: number;

  @Prop({ default: null })
  updated_at: number;

  @Prop({ default: null, type: Object })
  metadata: any;
}

export const DesignSchema = SchemaFactory.createForClass(Design);

DesignSchema.pre('save', function (next) {
  this.designId = `design-${randomUUID().slice(0, 8)}`;
  this.created_at = Date.now();
  this.updated_at = Date.now();
  next();
});
