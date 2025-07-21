import { UserService } from "./user.service";
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    getUser(): Promise<import("./user.entity").User[]>;
}
