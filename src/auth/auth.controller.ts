import {Controller, Post, Query, Body, Get, HttpCode} from "@nestjs/common";
import {AuthService} from "./auth.service";
import {SendLoginDto, VerifyLinkDto} from "../../user/dto/user.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login-link")
  @HttpCode(200)
  async requestLink(@Body() body: SendLoginDto) {
    await this.authService.sendMagicLink(body.email, body.name, body.techstack);
    return {message: "Login link sent to email"};
  }

  @Get("verify")
  async verify(@Query() query: VerifyLinkDto) {
    const jwt = await this.authService.verifyToken(query.token);
    return {token: jwt};
  }
}
