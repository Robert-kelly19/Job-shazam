import {Controller, Post, Body, HttpCode, UnauthorizedException} from "@nestjs/common";
import {AuthService} from "./auth.service";
import {SendLoginDto, VerifyLinkDto} from "../user/dto/user.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login-otp")
  @HttpCode(200)
  async requestOtp(@Body() body: SendLoginDto) {
    await this.authService.sendOtp(body.email, body.name, body.techstack);
    return {message: "OTP sent to email"};
  }

  @Post("verify-otp")
  async verifyOtp(@Body() body: VerifyLinkDto) {
    try {
      const jwt = await this.authService.verifyOtp(body.email, body.token);
      return {accessToken: jwt, user: await this.authService.getUserByEmail(body.email)}; // Need to fetch user details to return
    } catch (err) {
      throw new UnauthorizedException(err.message || "Invalid or expired OTP");
    }
  }
}
