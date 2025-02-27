import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NestService } from 'core/src/lib/nest.service';
import { User } from 'src/entities/user.entity';
import { UserSchema } from 'src/schemas/user.schema';
import { Repository } from 'typeorm';

@Injectable()
export class UserService extends NestService<User> {
  constructor(
    @InjectRepository(UserSchema)
    private usersRepository: Repository<User>,
  ) {
    super(usersRepository);
  }
}
