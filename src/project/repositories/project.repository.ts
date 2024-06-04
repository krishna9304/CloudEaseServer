import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Project } from '../schemas/project.schema';
import { AbstractRepository } from 'src/database/abstract.repository';

@Injectable()
export class ProjectRepository extends AbstractRepository<Project> {
  protected readonly logger = new Logger(ProjectRepository.name);

  constructor(
    @InjectModel(Project.name) projectModel: Model<Project>,
    @InjectConnection() connection: Connection,
  ) {
    super(projectModel, connection);
  }
}
