import {MigrationInterface, QueryRunner} from "typeorm";

export class NewMigration1753759182511 implements MigrationInterface {
  name = "NewMigration1753759182511";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "companylogo"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "cv"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "cv" text`);
    await queryRunner.query(`ALTER TABLE "job" ADD "companylogo" text`);
  }
}
