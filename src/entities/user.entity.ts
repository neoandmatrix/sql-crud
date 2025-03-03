import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Addresses } from './addresses.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  deleted: boolean;

  @OneToMany(() => Addresses, (address) => address.user)
  addresses: Addresses[];
}
