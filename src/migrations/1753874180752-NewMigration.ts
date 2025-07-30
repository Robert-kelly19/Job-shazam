import {MigrationInterface, QueryRunner} from "typeorm";

export class NewMigration1753874180752 implements MigrationInterface {
  name = "NewMigration1753874180752";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "companyLogo"`);
    await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "detailed"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "cv"`);
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "token" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "token" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "user" ADD "cv" character varying`);
    await queryRunner.query(`ALTER TABLE "job" ADD "detailed" jsonb`);
    await queryRunner.query(`ALTER TABLE "job" ADD "companyLogo" character varying`);
  }
}
