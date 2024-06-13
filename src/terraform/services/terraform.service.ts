import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { RedisService } from './redis.service';
import { EventsGateway } from './events.gateway';
import { join } from 'path';
import { existsSync, mkdirSync, rmdirSync } from 'fs';
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

  runCommand(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const process = exec(command);

      process.stdout.on('data', (data) => {
        this.redisService.publish('terraform-progress', data);
        this.eventsGateway.sendMessage('terraform-progress', data);
      });

      process.stderr.on('data', (data) => {
        this.redisService.publish('terraform-progress', data);
        this.eventsGateway.sendMessage('terraform-progress', data);
      });

      process.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with code ${code}`));
        }
      });
    });
  }

  async runTerraformPipeline(): Promise<void> {
    await this.runCommand('terraform init');
    await this.runCommand('terraform validate');
    await this.runCommand('terraform plan');
    await this.runCommand('terraform apply -auto-approve');
  }

  async prepareTerraformFiles(
    _nodes: CanvasNode[],
    _edges: CanvasEdge[],
    project: Project,
  ): Promise<void> {
    if (project.cloudProvider === CloudProvider.Azure)
      this.setAzureCredentials(project.azureDetails);
    else this.setAwsCredentials(project.awsDetails);

    const tfDirectory = join(process.cwd(), 'tmp', 'terraform');
    if (!existsSync(tfDirectory)) mkdirSync(tfDirectory, { recursive: true });
    else {
      rmdirSync(tfDirectory, { recursive: true, maxRetries: 3 });
      mkdirSync(tfDirectory, { recursive: true });
    }
    process.chdir(tfDirectory);
  }
}
