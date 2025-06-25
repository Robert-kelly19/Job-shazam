import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { Job } from "./job.entity";
 

@Module({
    imports: [TypeOrmModule.forFeature([Job])],
    controllers: [],
    providers: []
})

export class JobModule {}