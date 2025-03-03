import { EntitySchema } from 'typeorm';
import { User } from '../entities/user.entity';

export const UserSchema = new EntitySchema<User>({
  name: 'User',
  target: User,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  relations: {
    addresses: {
      type: 'one-to-many',
      target: 'Addresses',
      inverseSide: 'user',
    },
  },
});
