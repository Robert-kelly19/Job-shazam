export declare enum jobStatus {
    SAVED = "saved",
    APPLIED = "applied",
    REJECTED = "rejected",
    RECRUITED = "recruited",
    UNRESPONSIVE = "unresponsive"
}
export declare class UpdateStatusDto {
    status: jobStatus;
}
export declare class savedJobDto {
    job: string;
    status: jobStatus;
}
