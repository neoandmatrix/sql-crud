import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { User } from '../../entities/user.entity';
import { UserService } from './user.service';
import { PaginatedResponse } from 'core/src/lib/types/PaginatedResponse';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: User): Promise<User | User[]> {
    return this.userService._create(createUserDto);
  }

  @Get()
  find(
    @Query() query: Record<string, any>,
  ): Promise<PaginatedResponse<User> | User[]> {
    return this.userService._find(query);
  }
}
