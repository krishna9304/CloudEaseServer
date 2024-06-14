import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService {
  private publishClient: RedisClientType;
  private subscribeClient: RedisClientType;

  constructor(private readonly configService: ConfigService) {
    this.publishClient = createClient({
      url: this.configService.get<string>('REDIS_URI'),
    });
    this.subscribeClient = createClient({
      url: this.configService.get<string>('REDIS_URI'),
    });

    this.publishClient.connect();
    this.subscribeClient.connect();
  }

  async publish(channel: string, message: string): Promise<void> {
    await this.publishClient.publish(channel, message);
    await this.publishClient.rPush(`${channel}:logs`, message);
  }

  async subscribe(
    channel: string,
    callback: (message: string) => void,
  ): Promise<void> {
    this.subscribeClient.subscribe(channel, (message) => {
      callback(message);
    });
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.subscribeClient.unsubscribe(channel);
  }

  async disconnect(): Promise<void> {
    await this.publishClient.disconnect();
    await this.subscribeClient.disconnect();
  }

  async getLogs(channel: string): Promise<string[]> {
    return await this.publishClient.lRange(`${channel}:logs`, 0, -1);
  }
}
