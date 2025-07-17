import {Injectable} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import * as nodemailer from "nodemailer";
import {GetMailDto, SendMailDto} from "./dto/maildto";

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: this.config.get<string>("MAIL_USER"),
        pass: this.config.get<string>("MAIL_PASSWORD"),
      },
    });
  }

  async sendMail(dto: SendMailDto): Promise<void> {
    const {to} = dto;

    const mailOptions = {
      from: `"JobShazam"<${this.config.get<string>("MAIL_USER")}>`,
      to,
      subject: "Welcome to the Fam!",
      text: `Hi there 👋

      You're officially subscribed to JobShazam — the smarter way to job hunt.
      
      Here’s what to expect:
      Instant alerts for relevant jobs
      Insights to sharpen your career strategy
      Expert advice to ace every step of the hiring process
      
      More interviews. Better jobs. Less stress.
      
      Let’s make moves. 
      
      – JobShazam`,
    };
    try {
      const info = await this.transporter.sendMail(mailOptions);
      return info.response;
    } catch (error) {
      return error;
    }
  }

  async GetMail(dto: GetMailDto): Promise<void> {
    const mailOptions = {
      from: `"JobShazam"<${this.config.get<string>("MAIL_USER")}>`,
      to: `"JobShazam"<${this.config.get<string>("MAIL_USER")}>`,
      replyTo: dto.from,
      subject: `New message from ${dto.from}: ${dto.subject}`,
      text: `You got a message from ${dto.from}:\n\n${dto.text}`,
    };
    try {
      const info = await this.transporter.sendMail(mailOptions);
      return info.response;
    } catch (error) {
      return error;
    }
  }

  async SendLogInMail(email: string, link: string) {
    const mailOptions = {
      from: `"JobShazam"<${this.config.get<string>("MAIL_USER")}>`,
      to: email,
      subject: "JobShazam Login Link",
      html: `<p>Click to login: <a href="${link}">${link}</a></p>`,
    };
    try {
      const info = await this.transporter.sendMail(mailOptions);
      return info.response;
    } catch (error) {
      return error;
    }
  }
}
