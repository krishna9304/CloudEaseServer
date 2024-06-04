import { IsEmpty, IsObject } from 'class-validator';
import { Types } from 'mongoose';
import { CanvasComponents } from '../schemas/design.schema';

export class DesignDto {
  @IsEmpty()
  _id: Types.ObjectId;

  @IsEmpty()
  designId: string;

  @IsObject()
  components: CanvasComponents;

  @IsEmpty()
  created_at: number;

  @IsEmpty()
  updated_at: number;

  @IsEmpty()
  metadata: any;
}
