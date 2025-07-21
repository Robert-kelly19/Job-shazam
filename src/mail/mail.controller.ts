import {Body, Controller, HttpCode, Post, Query, Res} from "@nestjs/common";
import {MailService} from "./mail.service";
import {GetMailDto, SendMailDto} from "./dto/maildto";
import {Response} from "express";

@Controller("mail")
export class MailController {
  constructor(private readonly mailService: MailService) {}
  @Post("getMail")
  @HttpCode(200)
  async getMail(@Body() GetMailDto: GetMailDto) {
    await this.mailService.GetMail(GetMailDto);
    return {message: `Email sent to jobshazam@gmail.com`};
  }

  @Post("sendMail")
  async sendMail(@Query() SendMailDto: SendMailDto, @Res() res: Response) {
    try {
      await this.mailService.sendMail(SendMailDto);
      return res.status(200).json({
        message: `Successfully subscribed. New job Updates will be sent to: ${SendMailDto.to}`,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({message: `Something went wrong while subscribing.`});
    }
  }
}
