import { ConflictException, Injectable, NotFoundException,UnauthorizedException } from '@nestjs/common';
import { CreateUserDto, DeleteUserDto, UserLoginDto, UserUpdateDto, GetUserDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';

interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  password: string; 
}

@Injectable()
export class UserService {
  private users: User[] = [];
  private idCounter = 1;

  async createUser(createUserDto: CreateUserDto): Promise<GetUserDto> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const existingUser = this.users.find(u=>u.email=== createUserDto.email)
    if(existingUser) {
        throw new ConflictException ('Email already in use')
    }
    const newUser: User = {
      id: this.idCounter++,
      firstname: createUserDto.firstname,
      lastname: createUserDto.lastname,
      email: createUserDto.email,
      password: hashedPassword,
    };
    this.users.push(newUser);
    return new GetUserDto(newUser);
  }

  async login(userLoginDto: UserLoginDto): Promise<GetUserDto> {
    const user = this.users.find(u => u.email === userLoginDto.email);
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(userLoginDto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return new GetUserDto(user);
  }

  findAll(): GetUserDto[] {
    return this.users.map(user => new GetUserDto(user));
  }

  findById(id: number): GetUserDto {
    const user = this.users.find(u => u.id === id);
    if (!user) throw new NotFoundException('User not found');
    return new GetUserDto(user);
  }

  async updateUser(id: number, updateDto: UserUpdateDto): Promise<GetUserDto> {
    const user = this.users.find(u => u.id === id);
    if (!user) throw new NotFoundException('User not found');

    if (updateDto.firstname) user.firstname = updateDto.firstname;
    if (updateDto.lastname) user.lastname = updateDto.lastname;
    if (updateDto.email) user.email = updateDto.email;
    if (updateDto.password) {
      user.password = await bcrypt.hash(updateDto.password, 10);
    }

    return new GetUserDto(user);
  }

  async deleteUser(deleteDto: DeleteUserDto): Promise<{ message: string }> {
    const userIndex = this.users.findIndex(u => u.email === deleteDto.email);
    if (userIndex === -1) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(deleteDto.password, this.users[userIndex].password);
    if (!isMatch) throw new UnauthorizedException('Invalid password');

    this.users.splice(userIndex, 1);
    return { message: 'User deleted successfully' };
  }
}
