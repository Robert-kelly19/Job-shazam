import {Injectable, Logger} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import * as nodemailer from "nodemailer";
import {GetMailDto, SendMailDto} from "./dto/maildto";

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private config: ConfigService) {
    const user = this.config.get<string>("MAIL_USER");
    const pass = this.config.get<string>("MAIL_PASSWORD");

    if (!user || !pass) {
      this.logger.error(
        "SMTP credentials missing! Check MAIL_USER and MAIL_PASSWORD environment variables.",
      );
    }

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
      subject: `New message from ${dto.from}`,
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
      html: `<p><a href="${link}">Click to login</a></p>`,
    };
    try {
      const info = await this.transporter.sendMail(mailOptions);
      return info.response;
    } catch (error) {
      return error;
    }
  }

  async SendOtpMail(email: string, otp: string) {
    const mailOptions = {
      from: `"JobShazam"<${this.config.get<string>("MAIL_USER")}>`,
      to: email,
      subject: "Your JobShazam Login OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Login Verification</h2>
          <p>Your verification code is:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire shortly. Do not share it with anyone.</p>
        </div>
      `,
    };
    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`OTP mail sent successfully to ${email}`);
      return info.response;
    } catch (error) {
      this.logger.error(`Failed to send OTP mail to ${email}:`, error);
      throw error;
    }
  }
}
