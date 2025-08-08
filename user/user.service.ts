import { Injectable, NotFoundException} from '@nestjs/common';
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

  async findUser(): Promise<User[]>{
   return this.repo.find()
  }

  async findByToken(token:string){
    return this.repo.findOne({where:{token,used:false},});
  }

  async createOrUpdateToken (email:string, token: string, name?: string, techstack?: string[]){
    let user = await this.findByEmail(email)

    if(!user){
      user= this.repo.create({email,token,used:false,name,techstack});
    }else {
      user.token = token;
      user.used = false;
      user.name = name;
      user.techstack = techstack
    }
    return this.repo.save(user);
  }

  async markUsedToken(userId:string){
    await this.repo.update(userId, {used: true});
  }

  async uploadCv (email:string,file: Express.Multer.File): Promise<User>{
   const user = await this.findByEmail(email);
   if(!user){
    throw new NotFoundException('user not found. Signin to upload cv')
   }
   user.cv = file.path;
   return this.repo.save(user)
}
}
