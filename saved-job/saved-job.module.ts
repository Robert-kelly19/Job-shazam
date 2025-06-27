import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SavedJob } from "./saved-job.entity";


@Module({
    imports: [
        TypeOrmModule.forFeature([SavedJob])
    ],
    controllers:[],
    providers: []
})

export class SavedJobModule {}