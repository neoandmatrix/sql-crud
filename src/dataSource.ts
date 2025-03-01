import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';

export default new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'password',
  database: 'sql_abstraction',
  entities: [User],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'custom_migration_table',
});
