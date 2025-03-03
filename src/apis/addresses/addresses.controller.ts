import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { User } from '../../entities/user.entity';
import { AddressesService } from './addresses.service';
import { PaginatedResponse } from 'core/src/lib/types/PaginatedResponse';
import { Addresses } from 'src/entities/addresses.entity';

@Controller('users')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  create(@Body() createUserDto: User): Promise<Addresses | Addresses[]> {
    return this.addressesService._create(createUserDto);
  }

  @Get()
  find(
    @Query() query: Record<string, any>,
  ): Promise<PaginatedResponse<Addresses> | Addresses[]> {
    return this.addressesService._find(query);
  }
}
