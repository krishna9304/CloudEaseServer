import { Module } from '@nestjs/common';
import { TerraformService } from './services/terraform.service';
import { RedisService } from './services/redis.service';
import { EventsGateway } from './services/events.gateway';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        REDIS_URI: Joi.string().required(),
      }),
      envFilePath: '.env',
    }),
  ],
  providers: [TerraformService, RedisService, EventsGateway],
  exports: [TerraformService, RedisService, EventsGateway],
})
export class TerraformModule {}
