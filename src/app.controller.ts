import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiResponseType } from './constants/apiResponse';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): ApiResponseType {
    return this.appService.getServerHealth();
  }
}
