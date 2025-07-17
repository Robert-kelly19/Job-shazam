import { Injectable} from '@nestjs/common';
import { InjectRepository} from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
 
@Injectable()
export class UserService { 
  constructor(
    @InjectRepository(User) private repo: Repository<User>
  ) {}

  findByEmail(email: string) {
    return this.repo.findOne({where: {email},});
  }

  async findByToken(token:string){
    return this.repo.findOne({where:{token,used:false},});
  }

  async createOrUpdateToken (email:string, token: string){
    let user = await this.findByEmail(email)

    if(!user){
      user= this.repo.create({email,token,used:false});
    }else {
      user.token = token;
      user.used = false;
    }
    return this.repo.save(user);
  }

  async markUsedToken(userId:string){
    await this.repo.update(userId, {used: true});
  }
}
