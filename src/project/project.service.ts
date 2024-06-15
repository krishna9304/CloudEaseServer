import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectRepository } from './repositories/project.repository';
import { ProjectDto } from './dto/project.dto';
import { Project } from './schemas/project.schema';
import { DesignRepository } from './repositories/design.repository';
import { Design } from './schemas/design.schema';
import { TerraformService } from 'src/terraform/services/terraform.service';

@Injectable()
export class ProjectService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly designRepository: DesignRepository,
    private readonly terraformService: TerraformService,
  ) {}

  async createProject(reqBody: ProjectDto): Promise<{
    project: Project;
    design: Design;
  }> {
    const project = await this.projectRepository.create(reqBody);
    const design = await this.designRepository.create({
      projectId: project.projectId,
    } as Design);
    return { project, design };
  }

  async updateProject(
    projectId: string,
    reqBody: Partial<ProjectDto>,
  ): Promise<Project> {
    const projectExists = await this.projectRepository.exists({
      projectId,
      userId: reqBody.userId,
    });
    if (!projectExists) {
      throw new NotFoundException('Project not found. Invalid projectId.');
    }
    const project = await this.projectRepository.findOneAndUpdate(
      { projectId },
      reqBody,
    );
    return project;
  }

  async updateDesign(designId: string, reqBody: any): Promise<Design> {
    const designExists = await this.designRepository.exists({ designId });
    if (!designExists) {
      throw new NotFoundException('Design not found. Invalid designId.');
    }
    const design = await this.designRepository.findOne({ designId });
    const project = await this.projectRepository.findOne({
      projectId: design.projectId,
    });

    if (project.publishing || project.published) {
      throw new ForbiddenException(
        'DesignLocked: Design cannot be updated. Project is being published or already published.',
      );
    }
    const updatedDesign = await this.designRepository.findOneAndUpdate(
      { designId },
      reqBody,
    );
    return updatedDesign;
  }

  async getProjects(
    userId: string,
    page: number,
    limit: number,
  ): Promise<Project[]> {
    const projects = this.projectRepository.find(
      { userId },
      {
        page,
        limit,
        sort: { created_at: -1 },
      },
    );
    return projects;
  }

  async getProject(projectId: string, userId: string): Promise<Project> {
    const projectExists = await this.projectRepository.exists({
      projectId,
      userId,
    });
    if (!projectExists) {
      throw new NotFoundException('Project not found. Invalid projectId.');
    }

    const project = this.projectRepository.findOne({ projectId });
    return project;
  }

  async getDesign(projectId: string, userId: string): Promise<Design> {
    const projectExists = await this.projectRepository.exists({
      projectId,
      userId,
    });
    if (!projectExists) {
      throw new NotFoundException('Project not found. Invalid projectId.');
    }
    const design = this.designRepository.findOne({ projectId });
    return design;
  }

  async publishProject(
    projectId: string,
    userId: string,
    nodeDetails: {
      [key: string]: {
        label: string;
        [key: string]: string;
      };
    },
  ): Promise<void> {
    const projectExists = await this.projectRepository.exists({
      projectId,
      userId,
    });
    if (!projectExists) {
      throw new NotFoundException('Project not found. Invalid projectId.');
    }
    const project = await this.projectRepository.findOne({ projectId });

    if (project.publishing) {
      throw new Error('Project is already being published. Please wait.');
    }
    const bulkOps = Object.keys(nodeDetails).map((key) => {
      return {
        updateOne: {
          filter: {
            'components.nodes.id': key,
            projectId: project.projectId,
          },
          update: { $set: { 'components.nodes.$.config': nodeDetails[key] } },
        },
      };
    });

    if (bulkOps.length > 0) {
      await this.designRepository.bulkWrite(bulkOps);
    }

    await this.projectRepository.findOneAndUpdate(
      { projectId: project.projectId },
      { publishing: true },
    );
    const design = await this.designRepository.findOne({ projectId });
    const { nodes, edges } = design.components;
    this.terraformService.prepareTerraformFiles(nodes, edges, project);
  }
}
