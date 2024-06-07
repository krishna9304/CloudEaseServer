import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ProjectDto } from './dto/project.dto';
import { ProjectService } from './project.service';
import { ApiResponse } from 'src/constants/apiResponse';
import { CurrentUser } from 'src/users/current-user.decorator';
import { User } from 'src/users/schemas/user.schema';

@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createProject(@Body() reqBody: ProjectDto, @CurrentUser() user: User) {
    reqBody.userId = user.email;
    const { project, design } =
      await this.projectService.createProject(reqBody);
    const res = new ApiResponse('Project created.', null, 201, {
      project,
      design,
    });
    return res.getResponse();
  }

  @Put(':projectId')
  @UseGuards(JwtAuthGuard)
  async updateProject(
    @Body() reqBody: Partial<ProjectDto>,
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
  ) {
    reqBody.userId = user.email;
    const project = await this.projectService.updateProject(projectId, reqBody);
    const res = new ApiResponse('Project updated.', null, 200, {
      project,
    });
    return res.getResponse();
  }

  @Put('design/:designId')
  @UseGuards(JwtAuthGuard)
  async updateDesign(
    @Body() reqBody: any,
    @Param('designId') designId: string,
  ) {
    const design = await this.projectService.updateDesign(designId, reqBody);
    const res = new ApiResponse('Design updated.', null, 200, {
      design,
    });
    return res.getResponse();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getProjects(@Query() query: any, @CurrentUser() user: User) {
    if (!query.page || query.page < 1) query.page = 1;
    if (!query.limit || query.limit < 1) query.limit = 10;

    const projects = await this.projectService.getProjects(
      user.email,
      parseInt(query.page),
      parseInt(query.limit),
    );
    const res = new ApiResponse('All Projects fetched.', null, 200, {
      projects,
    });
    return res.getResponse();
  }

  @Get(':projectId')
  @UseGuards(JwtAuthGuard)
  async getProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
  ) {
    const project = await this.projectService.getProject(projectId, user.email);
    const res = new ApiResponse(
      'Project Details for ' + projectId + ' fetched.',
      null,
      200,
      {
        project,
      },
    );
    return res.getResponse();
  }

  @Get(':projectId/design')
  @UseGuards(JwtAuthGuard)
  async getDesign(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
  ) {
    const design = await this.projectService.getDesign(projectId, user.email);
    const res = new ApiResponse('Design Deatails.', null, 200, {
      design,
    });
    return res.getResponse();
  }
}
