import {Body, Controller, Post, Query} from "@nestjs/common";
import {MailService} from "./mail.service";
import {GetMailDto, SendMailDto} from "./dto/maildto";

@Controller("mail")
export class MailController {
  constructor(private readonly mailService: MailService) {}
  @Post("getMail")
  async getMail(@Body() GetMailDto: GetMailDto) {
    return this.mailService.GetMail(GetMailDto);
  }

  @Post("sendMail")
  async sendMail(@Query() SendMailDto: SendMailDto) {
    return this.mailService.sendMail(SendMailDto);
  }
}
