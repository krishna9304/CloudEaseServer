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
import { ProjectRepository } from 'src/project/repositories/project.repository';
import * as AdmZip from 'adm-zip';
import { Readable } from 'stream';

@Injectable()
export class TerraformService {
  constructor(
    private readonly redisService: RedisService,
    private readonly eventsGateway: EventsGateway,
    private readonly projectRepository: ProjectRepository,
  ) {}

  private readonly logger = new Logger(TerraformService.name);
  private tfConfig: Record<string, any> = {};

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
      await this.projectRepository.findOneAndUpdate(
        { projectId: project.projectId },
        { publishing: false },
      );
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
      await this.projectRepository.findOneAndUpdate(
        { projectId: project.projectId },
        { publishing: false },
      );
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
      await this.projectRepository.findOneAndUpdate(
        { projectId: project.projectId },
        { publishing: false },
      );
      this.logger.error('Error planning Terraform:', error);
      return;
    } finally {
      process.chdir(rootDir);
    }

    try {
      process.chdir(workingDir);
      this.logger.debug('Applying Terraform');
      await this.runCommand(
        'terraform apply -auto-approve',
        project.projectId,
        project.userId,
        '4. Applying the plan',
      );
      await this.projectRepository.findOneAndUpdate(
        { projectId: project.projectId },
        { published: true, publishing: false },
      );

      const finalEventsToPublish = {
        admin_username: this.tfConfig.admin_username,
        location: this.tfConfig.location,
        resource_group: this.tfConfig.resource_group,
        stateFileKey:
          project.cloudProvider === CloudProvider.Azure
            ? project.azureDetails.backendKey
            : 'terraform.tfstate',
      };

      this.redisService.publish(
        `${project.projectId}:terraform-progress`,
        `\n\n\x1b[36mYay! Pipeline executed successfully. Below are the deployment details, please take a note of it:\n\n`,
      );
      Object.keys(finalEventsToPublish).forEach((key) => {
        this.redisService.publish(
          `${project.projectId}:terraform-progress`,
          `\x1b[36m${key} => ${finalEventsToPublish[key]}\n`,
        );
      });
    } catch (error) {
      await this.projectRepository.findOneAndUpdate(
        { projectId: project.projectId },
        { publishing: false },
      );
      this.logger.error('Error applying Terraform:', error);
      return;
    }
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

  prepareAzureTfJson(
    project: Project,
    nodes: CanvasNode[],
    _edges: CanvasEdge[],
    tfDirectory: string,
    rootDir: string,
  ) {
    const mappingsFilePath = join(
      rootDir,
      'src',
      'terraform',
      'constants',
      'mappings.json',
    );
    const mappingJson = JSON.parse(readFileSync(mappingsFilePath, 'utf-8'));

    const tfJsonPath = join(tfDirectory, 'terraform.tfvars.json');
    const tfJson = JSON.parse(readFileSync(tfJsonPath, 'utf-8'));

    const resourceNamingConvention = (name: string, resourceType: string) => {
      return `${name.replace(/ /g, '-').toLowerCase()}-${resourceType}`;
    };
    this.tfConfig = {
      tags: {
        project: project.projectName,
        environment: 'dev',
        provisioner: 'cloudease',
      },
      vnet: {
        vnet_name: resourceNamingConvention(project.projectName, 'vnet'),
        address_space: ['10.0.0.0/16'],
      },
      subnet: {
        subnet_name: resourceNamingConvention(project.projectName, 'subnet'),
        vnet_name: resourceNamingConvention(project.projectName, 'vnet'),
        address_prefixes: ['10.0.1.0/24'],
      },
      linux_vms: {},
      mongodbs: {},
      storage_accounts: {},
      admin_username: tfJson.admin_username,
      location:
        project.cloudProvider === CloudProvider.Azure
          ? project.azureDetails.region
          : project.awsDetails.region,
      resource_group: resourceNamingConvention(project.projectName, 'rg'),
    };

    let vm_count = 1;
    let mongodb_count = 1;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const nodeType = mappingJson[project.cloudProvider][node.resourceName];
      if (nodeType === 'linux_vm') {
        this.tfConfig.linux_vms[nodeType + '_' + vm_count++] = {
          vm_name: node.config['appName'],
          vm_size: node.config['vmSize'] || 'Standard_B1s',
          create_public_ip: node.config['publicIp'] === 'true',
        };
      } else if (nodeType === 'mongodb') {
        this.tfConfig.mongodbs[nodeType + '_' + mongodb_count++] = {
          mongodb_name: node.config['accountName'],
          database_name: node.config['dbName'],
        };
      }
    }

    writeFileSync(tfJsonPath, JSON.stringify(this.tfConfig, null, 2));
  }

  prepareTerraformFiles(
    nodes: CanvasNode[],
    edges: CanvasEdge[],
    project: Project,
    prepareType: string = 'publish',
  ): Readable | void {
    const rootDir = process.cwd();
    const tmpDir = join(rootDir, 'tmp');
    const tfDirectory = join(tmpDir, 'terraform');
    const tfTemplateDir = join(rootDir, 'src', 'terraform');

    if (project.cloudProvider === CloudProvider.Azure) {
      this.setAzureCredentials(project.azureDetails);
    } else {
      this.setAwsCredentials(project.awsDetails);
    }

    let zStream: Readable;
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
      this.prepareBackendTf(project, tfDirectory);

      if (project.cloudProvider === CloudProvider.Azure) {
        this.setAzureCredentials(project.azureDetails);
        this.prepareAzureTfJson(project, nodes, edges, tfDirectory, rootDir);
      } else this.setAwsCredentials(project.awsDetails);

      if (prepareType === 'publish') {
        this.logger.debug(
          `Generated terraform files for ${project.projectId}. Running Terraform pipeline now.`,
        );
        this.runTerraformPipeline(tfDirectory, project, rootDir);
      } else {
        const zip = new AdmZip();
        zip.addLocalFolder(tfDirectory);
        const zipBuffer = zip.toBuffer();
        const zipStream = new Readable();
        zipStream.push(zipBuffer);
        zipStream.push(null);
        zStream = zipStream;
      }
    } catch (error) {
      this.logger.error('Error preparing Terraform files', error);
    } finally {
      process.chdir(rootDir);
      rmSync(tmpDir, { recursive: true, force: true });
      return zStream;
    }
  }
}
