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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedJob = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../user/user.entity");
const job_entity_1 = require("../job/job.entity");
let SavedJob = class SavedJob {
    id;
    user;
    job;
    status;
    savedAt;
};
exports.SavedJob = SavedJob;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SavedJob.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.savedJobs, { onDelete: 'CASCADE' }),
    __metadata("design:type", user_entity_1.User)
], SavedJob.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => job_entity_1.Job, job => job.savedByUsers, { onDelete: 'CASCADE' }),
    __metadata("design:type", job_entity_1.Job)
], SavedJob.prototype, "job", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'saved' }),
    __metadata("design:type", String)
], SavedJob.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SavedJob.prototype, "savedAt", void 0);
exports.SavedJob = SavedJob = __decorate([
    (0, typeorm_1.Entity)()
], SavedJob);
