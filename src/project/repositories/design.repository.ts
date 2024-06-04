import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Design } from '../schemas/design.schema';
import { AbstractRepository } from 'src/database/abstract.repository';

@Injectable()
export class DesignRepository extends AbstractRepository<Design> {
  protected readonly logger = new Logger(DesignRepository.name);

  constructor(
    @InjectModel(Design.name) designModel: Model<Design>,
    @InjectConnection() connection: Connection,
  ) {
    super(designModel, connection);
  }
}
