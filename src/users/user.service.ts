import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import * as bcrypt from 'bcrypt';
import { UserDto } from './dto/user.dto';
import { User } from './schemas/user.schema';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(request: UserDto): Promise<User> {
    await this.validateCreateUserRequest(request);
    let user = await this.userRepository.create({
      ...request,
      password: await bcrypt.hash(request.password, 10),
    } as User);
    return user;
  }

  async validate(email: string, password: string): Promise<User> {
    const userExists = await this.userRepository.exists({ email });
    if (!userExists) {
      throw new NotFoundException('Invalid email.');
    }

    const user = await this.userRepository.findOne({ email });
    const passwordIsValid = await bcrypt.compare(password, user.password);

    if (!passwordIsValid) {
      throw new UnauthorizedException('Credentials are not valid.');
    }

    delete user.password;
    delete user.metadata;
    return user;
  }

  async getUser(filterQuery: Partial<User>): Promise<User> {
    const user: User = await this.userRepository.findOne(filterQuery);

    delete user.password;
    delete user.metadata;
    return user;
  }

  async validateCreateUserRequest(request: Partial<UserDto>) {
    let exists: any;
    try {
      exists = await this.userRepository.exists({ email: request.email });
    } catch (err) {}

    if (exists) {
      throw new UnprocessableEntityException(
        'User with similar details already exists.',
      );
    }
  }

  deleteUnwantedFields(user: User) {
    delete user.password;
    delete user.metadata;
    delete user.created_at;
    delete user.updated_at;
    delete user._id;
    return user;
  }
}
