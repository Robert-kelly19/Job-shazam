import { Repository } from 'typeorm';
import { User } from './user.entity';
export declare class UserService {
    private repo;
    constructor(repo: Repository<User>);
    findByEmail(email: string): Promise<User | null>;
    findUser(): Promise<User[]>;
    findByToken(token: string): Promise<User | null>;
    createOrUpdateToken(email: string, token: string, name?: string, techstack?: string[]): Promise<User>;
    markUsedToken(userId: string): Promise<void>;
}
