import {Injectable, UnauthorizedException} from "@nestjs/common";
import {UserService} from "../user/user.service";
import {MailService} from "src/mail/mail.service";
import {JwtService} from "@nestjs/jwt";

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private mailService: MailService,
    private jwtService: JwtService,
  ) {}

  async sendOtp(email: string, name?: string, techstack?: string[]) {
    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.userService.createOrUpdateToken(email, otp, name, techstack);
    await this.mailService.SendOtpMail(email, otp);
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.userService.findByEmail(email);
    if (!user || user.token !== otp) {
      throw new UnauthorizedException("Invalid or expired OTP");
    }

    await this.userService.markUsedToken(user.id);

    return this.jwtService.sign({sub: user.id, email: user.email});
  }

  async getUserByEmail(email: string) {
    return this.userService.findByEmail(email);
  }
}
