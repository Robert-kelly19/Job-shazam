"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedJobModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const saved_job_entity_1 = require("./saved-job.entity");
const saved_job_controller_1 = require("./saved-job.controller");
const saved_job_service_1 = require("./saved-job.service");
const jwt_strategy_1 = require("../src/auth/jwt.strategy");
let SavedJobModule = class SavedJobModule {
};
exports.SavedJobModule = SavedJobModule;
exports.SavedJobModule = SavedJobModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([saved_job_entity_1.SavedJob])
        ],
        controllers: [saved_job_controller_1.SavedJobController],
        providers: [saved_job_service_1.SavedJobService, jwt_strategy_1.JwtStrategy]
    })
], SavedJobModule);
