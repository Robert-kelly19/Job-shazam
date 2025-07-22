import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SavedJob } from "./saved-job.entity";
import { SavedJobController } from "./saved-job.controller";
import { SavedJobService } from "./saved-job.service";
import { JwtStrategy } from "auth/jwt.strategy";


@Module({
    imports: [
        TypeOrmModule.forFeature([SavedJob])
    ],
    controllers:[SavedJobController],
    providers: [SavedJobService, JwtStrategy]
})

export class SavedJobModule {}