import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { RedisService } from './redis.service';
import { EventsGateway } from './events.gateway';
import { join } from 'path';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { CanvasEdge, CanvasNode } from 'src/project/schemas/design.schema';
import {
  AwsDetails,
  AzureDetails,
  CloudProvider,
  Project,
} from 'src/project/schemas/project.schema';

@Injectable()
export class TerraformService {
  constructor(
    private readonly redisService: RedisService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  private readonly logger = new Logger(TerraformService.name);

  setAzureCredentials(details: AzureDetails): void {
    process.env.ARM_CLIENT_ID = details.clientId;
    process.env.ARM_CLIENT_SECRET = details.clientSecret;
    process.env.ARM_SUBSCRIPTION_ID = details.subscriptionId;
    process.env.ARM_TENANT_ID = details.tenantId;
    process.env.ARM_ACCESS_KEY = details.accessKey;
  }

  setAwsCredentials(details: AwsDetails): void {
    process.env.AWS_ACCESS_KEY_ID = details.accessKey;
    process.env.AWS_SECRET_ACCESS_KEY = details.secretKey;
  }

  runCommand(
    command: string,
    projectId: string,
    userId: string,
    stage: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const process = spawn(command, { shell: true });
      this.redisService.publish(
        `${projectId}:terraform-progress`,
        '\nStage: ' + stage + '\n',
      );

      const handleData = (data: any) => {
        const message = data.toString();
        this.redisService.publish(`${projectId}:terraform-progress`, message);
        this.eventsGateway.sendMessage(
          userId,
          `${projectId}:terraform-progress`,
          message,
        );
      };

      process.stdout.on('data', handleData);
      process.stderr.on('data', handleData);

      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with code ${code}`));
        }
      });
    });
  }

  async runTerraformPipeline(
    workingDir: string,
    project: Project,
    rootDir: string,
  ): Promise<void> {
    try {
      process.chdir(workingDir);
      this.logger.debug('Initializing Terraform');
      await this.runCommand(
        'terraform init',
        project.projectId,
        project.userId,
        '1. Initializing',
      );
    } catch (error) {
      this.logger.error('Error initializing Terraform:', error);
      return;
    } finally {
      process.chdir(rootDir);
    }

    try {
      process.chdir(workingDir);
      this.logger.debug('Validating Terraform');
      await this.runCommand(
        'terraform validate',
        project.projectId,
        project.userId,
        '2. Validating',
      );
    } catch (error) {
      this.logger.error('Error validating Terraform:', error);
      return;
    } finally {
      process.chdir(rootDir);
    }

    try {
      process.chdir(workingDir);
      this.logger.debug('Planning Terraform');
      await this.runCommand(
        'terraform plan',
        project.projectId,
        project.userId,
        '3. Planning',
      );
    } catch (error) {
      this.logger.error('Error planning Terraform:', error);
      return;
    } finally {
      process.chdir(rootDir);
    }
    // await this.runCommand('terraform apply -auto-approve');
  }

  prepareBackendTf(project: Project, tfDirectory: string): void {
    const backendFilePath = join(tfDirectory, 'backend.tf');

    let replaceMap: Record<string, string> = {};
    if (project.cloudProvider === CloudProvider.Azure)
      replaceMap = {
        backendResourceGroup: project.azureDetails.backendResourceGroup,
        backendStorageAccount: project.azureDetails.backendStorageAccount,
        backendContainer: project.azureDetails.backendContainer,
        backendKey: project.azureDetails.backendKey,
      };
    else
      replaceMap = {
        backendBucket: project.awsDetails.backendBucket,
        backendKey: project.awsDetails.backendKey,
      };

    try {
      let fileContent = readFileSync(backendFilePath, 'utf-8');
      for (const [key, value] of Object.entries(replaceMap)) {
        const regex = new RegExp(`<${key}>`, 'g');
        fileContent = fileContent.replace(regex, value);
      }
      writeFileSync(backendFilePath, fileContent);
    } catch (error) {
      console.error('Error preparing backend.tf:', error);
    }
  }

  prepareTerraformFiles(
    _nodes: CanvasNode[],
    _edges: CanvasEdge[],
    project: Project,
  ): void {
    const rootDir = process.cwd();
    const tfDirectory = join(rootDir, 'tmp', 'terraform');
    const tfTemplateDir = join(rootDir, 'src', 'terraform');

    if (project.cloudProvider === CloudProvider.Azure) {
      this.setAzureCredentials(project.azureDetails);
    } else {
      this.setAwsCredentials(project.awsDetails);
    }

    try {
      if (existsSync(tfDirectory)) {
        rmSync(tfDirectory, { recursive: true, force: true });
      }
      mkdirSync(tfDirectory, { recursive: true });

      const templateDir = join(
        tfTemplateDir,
        'templates',
        project.cloudProvider === CloudProvider.Azure ? 'azure' : 'aws',
      );

      cpSync(templateDir, tfDirectory, { recursive: true });
      this.logger.debug('Prepared terraform templates');
      this.prepareBackendTf(project, tfDirectory);
      this.logger.debug('Prepared backend.tf');

      if (project.cloudProvider === CloudProvider.Azure)
        this.setAzureCredentials(project.azureDetails);
      else this.setAwsCredentials(project.awsDetails);

      this.runTerraformPipeline(tfDirectory, project, rootDir);
    } catch (error) {
      this.logger.error('Error preparing Terraform files', error);
    } finally {
      process.chdir(rootDir);
    }
  }
}
