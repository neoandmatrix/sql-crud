import { EntitySchema } from 'typeorm';
import { Addresses } from '../entities/addresses.entity';

export const AddressesSchema = new EntitySchema<Addresses>({
  name: 'Addresses',
  target: Addresses,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    address: {
      type: String,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: Number,
      nullable: true,
    },
  },
  relations: {
    user: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: {
        name: 'userId',
      },
      inverseSide: 'addresses',
    },
  },
});
