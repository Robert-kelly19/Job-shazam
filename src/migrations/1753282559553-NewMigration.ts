import {MigrationInterface, QueryRunner} from "typeorm";

export class NewMigration1753282559553 implements MigrationInterface {
  name = "NewMigration1753282559553";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "job" DROP CONSTRAINT "FK_308fb0752c2ea332cb79f52ceaa"`);
    await queryRunner.query(
      `ALTER TABLE "job" ADD CONSTRAINT "FK_308fb0752c2ea332cb79f52ceaa" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "job" DROP CONSTRAINT "FK_308fb0752c2ea332cb79f52ceaa"`);
    await queryRunner.query(
      `ALTER TABLE "job" ADD CONSTRAINT "FK_308fb0752c2ea332cb79f52ceaa" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
