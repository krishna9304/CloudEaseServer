import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from 'src/auth/auth.service';
import { UserDto } from './dto/user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly usersService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Post('signup')
  async createUser(
    @Body() request: UserDto,
    @Res() response: Response,
  ): Promise<void> {
    const user = await this.usersService.createUser(request);
    return await this.authService.login(user, response, 'User registered');
  }
}
