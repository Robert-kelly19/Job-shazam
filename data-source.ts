// data-source.ts
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from 'user/user.entity';
import { SavedJob } from 'saved-job/saved-job.entity';
import { Job } from 'job/job.entity';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: +(process.env.DB_PORT || 5432),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, SavedJob, Job],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
