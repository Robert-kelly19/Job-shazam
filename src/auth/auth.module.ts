import {Module} from "@nestjs/common";
import {AuthService} from "./auth.service";
import {AuthController} from "./auth.controller";
import {JwtModule} from "@nestjs/jwt";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {MailModule} from "mail/mail.module";
import {UserModule} from "../../user/user.module";
import {JwtStrategy} from "./jwt.strategy";

@Module({
  imports: [
    UserModule,
    MailModule,
    ConfigModule.forRoot({isGlobal: true}),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET"),
        signOptions: {expiresIn: "12h"},
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
