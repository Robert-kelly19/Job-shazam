export declare class GetJobsDto {
    title: string;
    company: string;
    description?: string;
    location: string;
    salary?: string;
    tags?: string[];
    applyUrl: string;
    source: string;
}
export declare class DisplayJobsDto {
    id: string;
    title: string;
    company: string;
    description?: string;
    location: string;
    salary?: string;
    tags: string[];
    postedAt: Date;
    applyUrl: string;
    source: string;
    constructor(job: {
        id: string;
        title: string;
        company: string;
        description?: string;
        location: string;
        salary?: string;
        tags: string[];
        postedAt: Date;
        applyUrl: string;
        source: string;
    });
}
export declare class FilterJobDto {
    location?: string;
    salary?: string;
    tags?: string[];
}
