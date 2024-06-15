import { Module, forwardRef } from '@nestjs/common';
import { TerraformService } from './services/terraform.service';
import { RedisService } from './services/redis.service';
import { EventsGateway } from './services/events.gateway';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { ProjectModule } from 'src/project/project.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        REDIS_URI: Joi.string().required(),
      }),
      envFilePath: '.env',
    }),
    forwardRef(() => ProjectModule),
  ],
  providers: [TerraformService, RedisService, EventsGateway],
  exports: [TerraformService, RedisService, EventsGateway],
})
export class TerraformModule {}
