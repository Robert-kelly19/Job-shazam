import {Controller, Post, Body, HttpCode, UnauthorizedException} from "@nestjs/common";
import {AuthService} from "./auth.service";
import {SendLoginDto, VerifyLinkDto} from "../user/dto/user.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login-link")
  @HttpCode(200)
  async requestLink(@Body() body: SendLoginDto) {
    await this.authService.sendMagicLink(body.email, body.name, body.techstack);
    return {message: "Login link sent to email"};
  }

  @Post("verify")
  async verify(@Body() body: VerifyLinkDto) {
    try {
      const jwt = await this.authService.verifyToken(body.token);
      return {token: jwt};
    } catch (err) {
      throw new UnauthorizedException(err.message || "Invalid or expired token");
    }
  }
}
