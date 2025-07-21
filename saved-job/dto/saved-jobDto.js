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
exports.savedJobDto = exports.UpdateStatusDto = exports.jobStatus = void 0;
const class_validator_1 = require("class-validator");
var jobStatus;
(function (jobStatus) {
    jobStatus["SAVED"] = "saved";
    jobStatus["APPLIED"] = "applied";
    jobStatus["REJECTED"] = "rejected";
    jobStatus["RECRUITED"] = "recruited";
    jobStatus["UNRESPONSIVE"] = "unresponsive";
})(jobStatus || (exports.jobStatus = jobStatus = {}));
class UpdateStatusDto {
    status;
}
exports.UpdateStatusDto = UpdateStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(jobStatus),
    __metadata("design:type", String)
], UpdateStatusDto.prototype, "status", void 0);
class savedJobDto {
    job;
    status;
}
exports.savedJobDto = savedJobDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], savedJobDto.prototype, "job", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(jobStatus),
    __metadata("design:type", String)
], savedJobDto.prototype, "status", void 0);
