import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectRepository } from './repositories/project.repository';
import { ProjectDto } from './dto/project.dto';
import { Project } from './schemas/project.schema';
import { DesignRepository } from './repositories/design.repository';
import { Design } from './schemas/design.schema';

@Injectable()
export class ProjectService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly designRepository: DesignRepository,
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
    const design = await this.designRepository.findOneAndUpdate(
      { designId },
      reqBody,
    );
    return design;
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
}
