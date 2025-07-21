"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedJobController = void 0;
const common_1 = require("@nestjs/common");
const saved_job_service_1 = require("./saved-job.service");
const passport_1 = require("@nestjs/passport");
const saved_jobDto_1 = require("./dto/saved-jobDto");
const saved_jobDto_2 = require("./dto/saved-jobDto");
let SavedJobController = class SavedJobController {
    savedJob;
    constructor(savedJob) {
        this.savedJob = savedJob;
    }
    async create(dto, req) {
        const userId = req.user.userId;
        const existing = await this.savedJob.findByUserAndJob(userId, dto.job);
        if (existing) {
            throw new common_1.ConflictException('Job already saved by this user');
        }
        const created = await this.savedJob.CreateSavedJob({
            ...dto,
            user: userId,
        });
        return { message: 'Saved job created', data: created };
    }
    async getJobStatusForUser(jobId, req) {
        const userId = req.user.userId;
        const savedJob = await this.savedJob.findByUserAndJob(userId, jobId);
        if (!savedJob) {
            return { status: 'not_saved' };
        }
        return { status: savedJob.status };
    }
    async getAll(req) {
        const userId = req.user.userId;
        const jobs = await this.savedJob.GetSavedJobs(userId);
        return { data: jobs };
    }
    async update(jobId, body, req) {
        const userId = req.user.userId;
        const updated = await this.savedJob.UpdateStatus(userId, jobId, body.status);
        return { message: 'Status updated', data: updated };
    }
};
exports.SavedJobController = SavedJobController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [saved_jobDto_2.savedJobDto, Object]),
    __metadata("design:returntype", Promise)
], SavedJobController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':jobId/status'),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SavedJobController.prototype, "getJobStatusForUser", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SavedJobController.prototype, "getAll", null);
__decorate([
    (0, common_1.Patch)(':jobId'),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, saved_jobDto_1.UpdateStatusDto, Object]),
    __metadata("design:returntype", Promise)
], SavedJobController.prototype, "update", null);
exports.SavedJobController = SavedJobController = __decorate([
    (0, common_1.Controller)('saved-jobs'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [saved_job_service_1.SavedJobService])
], SavedJobController);
