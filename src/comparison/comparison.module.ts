import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";
import {Comparison} from "./comparison.entity";
import {ComparisonService} from "./comparison.service";
import {ComparisonController} from "./comparison.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Comparison])],
  controllers: [ComparisonController],
  providers: [ComparisonService],
  exports: [ComparisonService],
})
export class ComparisonModule {}
