import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ProjectDto } from './dto/project.dto';
import { ProjectService } from './project.service';
import { ApiResponse } from 'src/constants/apiResponse';
import { CurrentUser } from 'src/users/current-user.decorator';
import { User } from 'src/users/schemas/user.schema';
import { RedisService } from 'src/terraform/services/redis.service';
import { Response } from 'express';
import { Readable } from 'stream';

@Controller('project')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly redisService: RedisService,
  ) {}

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

  @Post(':projectId/publish')
  @UseGuards(JwtAuthGuard)
  async publishProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
  ) {
    await this.projectService.publishProject(projectId, user.email);
    const res = new ApiResponse(
      'Pipeline started. Your project is being published...',
      null,
      200,
      null,
    );
    return res.getResponse();
  }

  @Get(':projectId/log-stream')
  @UseGuards(JwtAuthGuard)
  async logStream(@Param('projectId') projectId: string, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const logs = await this.redisService.getLogs(
      `${projectId}:terraform-progress`,
    );
    for (const log of logs) {
      res.write(`data: ${JSON.stringify({ data: log })}\n\n`);
    }

    const callback = (message: string) => {
      res.write(`data: ${JSON.stringify({ data: message })}\n\n`);
    };

    await this.redisService.subscribe(
      `${projectId}:terraform-progress`,
      callback,
    );

    res.on('close', async () => {
      await this.redisService.unsubscribe(`${projectId}:terraform-progress`);
      res.end();
    });
  }
}
