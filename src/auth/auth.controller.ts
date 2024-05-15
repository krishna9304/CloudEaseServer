import { Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiResponse as APIresp } from 'src/constants/apiResponse';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { CurrentUser } from 'src/users/current-user.decorator';
import { User } from 'src/users/schemas/user.schema';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.login(user, response, 'User logged in');
  }

  @Get('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Res() response: Response) {
    this.authService.logout(response);
  }

  @Get('self')
  @UseGuards(JwtAuthGuard)
  async getSelf(@CurrentUser() user: User) {
    const res = new APIresp('User authenticated succesfully', null, 200, {
      user,
    });
    return res.getResponse();
  }
}
