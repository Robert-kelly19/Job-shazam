import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { Job } from "./job.entity";
import { JobController } from "./job.controller";
import { JobService } from "./job.service";
 

@Module({
    imports: [TypeOrmModule.forFeature([Job])],
    controllers: [JobController],
    providers: [JobService],
})

export class JobModule {}