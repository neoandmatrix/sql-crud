import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NestService } from 'core/src/lib/nest.service';
import { Addresses } from 'src/entities/addresses.entity';
import { AddressesSchema } from 'src/schemas/addresses.schema';
import { Repository } from 'typeorm';

@Injectable()
export class AddressesService extends NestService<Addresses> {
  constructor(
    @InjectRepository(AddressesSchema)
    private usersRepository: Repository<Addresses>,
  ) {
    super(usersRepository);
  }
}
