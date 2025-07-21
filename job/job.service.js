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
exports.JobService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const job_entity_1 = require("./job.entity");
const job_dto_1 = require("./dto/job.dto");
let JobService = class JobService {
    jobRepo;
    constructor(jobRepo) {
        this.jobRepo = jobRepo;
    }
    async create(jobDto) {
        if (!jobDto.description) {
            jobDto.description = '';
        }
        const existingJob = await this.jobRepo.findOne({
            where: { applyUrl: jobDto.applyUrl },
        });
        if (existingJob) {
            return new job_dto_1.DisplayJobsDto(existingJob);
        }
        const job = this.jobRepo.create(jobDto);
        const savedJob = await this.jobRepo.save(job);
        return new job_dto_1.DisplayJobsDto(savedJob);
    }
    async findAll() {
        const jobs = await this.jobRepo.find({
            order: { postedAt: 'DESC' },
        });
        return jobs.map((job) => new job_dto_1.DisplayJobsDto(job));
    }
    async findOne(id) {
        const job = await this.jobRepo.findOne({ where: { id } });
        return job ? new job_dto_1.DisplayJobsDto(job) : null;
    }
    async getFilterJobs(filterDto) {
        const { location, salary, tags } = filterDto;
        const query = this.jobRepo.createQueryBuilder('job');
        if (location) {
            query.andWhere('job.location = :location', { location });
        }
        if (salary) {
            query.andWhere('job.salary ILIKE :salary', { salary: `%${salary}%` });
        }
        if (tags && tags?.length) {
            query.andWhere('job.tags && ARRAY[:...tags]', { tags });
        }
        return query.getMany();
    }
};
exports.JobService = JobService;
exports.JobService = JobService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(job_entity_1.Job)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], JobService);
