export declare class SendLoginDto {
    name?: string;
    techstack?: string[];
    email: string;
}
export declare class VerifyLinkDto {
    token: string;
}
export declare class getUserDto {
    name: string;
    techstack: string[];
    email: string;
    token: string;
    used: boolean;
}
