import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { Project, ProjectSchema } from './schemas/project.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectRepository } from './repositories/project.repository';
import { DesignRepository } from './repositories/design.repository';
import { Design, DesignSchema } from './schemas/design.schema';
import { TerraformModule } from 'src/terraform/terraform.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
    MongooseModule.forFeature([{ name: Design.name, schema: DesignSchema }]),
    TerraformModule,
  ],
  controllers: [ProjectController],
  providers: [ProjectService, ProjectRepository, DesignRepository],
  exports: [ProjectRepository],
})
export class ProjectModule {}
