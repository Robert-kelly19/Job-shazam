import {MigrationInterface, QueryRunner} from "typeorm";

export class NewMigration1753372743207 implements MigrationInterface {
  name = "NewMigration1753372743207";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "job" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(200) NOT NULL, "company" character varying(200) NOT NULL, "description" character varying, "location" character varying NOT NULL, "salary" character varying, "tags" text array NOT NULL, "postedAt" TIMESTAMP NOT NULL DEFAULT now(), "applyUrl" character varying(500) NOT NULL, "source" character varying NOT NULL, "userId" uuid, CONSTRAINT "PK_98ab1c14ff8d1cf80d18703b92f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "saved_job" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" character varying NOT NULL DEFAULT 'saved', "savedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "jobId" uuid, CONSTRAINT "PK_eec7a26a4f0a651ab3d63c2a4a6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying, "techstack" text array, "email" character varying NOT NULL, "token" character varying NOT NULL, "used" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "job" ADD CONSTRAINT "FK_308fb0752c2ea332cb79f52ceaa" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_job" ADD CONSTRAINT "FK_65314280f947dd20a26faf013d2" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_job" ADD CONSTRAINT "FK_ceb2154a962ca924a284f15c2e7" FOREIGN KEY ("jobId") REFERENCES "job"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "saved_job" DROP CONSTRAINT "FK_ceb2154a962ca924a284f15c2e7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_job" DROP CONSTRAINT "FK_65314280f947dd20a26faf013d2"`,
    );
    await queryRunner.query(`ALTER TABLE "job" DROP CONSTRAINT "FK_308fb0752c2ea332cb79f52ceaa"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "saved_job"`);
    await queryRunner.query(`DROP TABLE "job"`);
  }
}
