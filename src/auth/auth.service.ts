import {Injectable, UnauthorizedException} from "@nestjs/common";
import {v4 as uuidv4} from "uuid";
import {UserService} from "user/user.service";
import {MailService} from "src/mail/mail.service";
import {JwtService} from "@nestjs/jwt";

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private mailService: MailService,
    private jwtService: JwtService,
  ) {}

  async sendMagicLink(email: string, name?: string, techstack?: string[]) {
    const token = uuidv4();
    await this.userService.createOrUpdateToken(email, token, name, techstack);
    const link = `http://localhost:8080/auth/verify?token=${token}`;
    await this.mailService.SendLogInMail(email, link);
  }

  async verifyToken(token: string) {
    const user = await this.userService.findByToken(token);
    if (!user) throw new UnauthorizedException("Invalid or expired token");

    await this.userService.markUsedToken(user.id);

    return this.jwtService.sign({sub: user.id, email: user.email});
  }
}
