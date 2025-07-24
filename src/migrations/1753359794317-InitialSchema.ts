import {MigrationInterface, QueryRunner} from "typeorm";

export class InitialSchema1753359794317 implements MigrationInterface {
  name = "InitialSchema1753359794317";

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
