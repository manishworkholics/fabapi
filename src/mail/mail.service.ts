import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { User } from '../user/user.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

 async sendUserConfirmation(user: User, token: string) {
  const url = `example.com/auth/confirm?token=${token}`;

  const to: string = user.email;

  await this.mailerService.sendMail({
    to,
    subject: 'Welcome to Nice App! Confirm your Email',
    template: './confirmation',
    context: {
      name: user.firstName ?? 'User',
      url,
    },
  });
}


  async sendVerificationMail(email: string, token: string) {
    const appUrl = this.configService.get('FRONTEND_URL');
    const appName = this.configService.get('APP_NAME');

    const to: string = email;

    const url = `${appUrl}auth/email/verification?token=${token}`;

    const mailStatus = await this.mailerService.sendMail({
      to,
      subject: `${appName} Account Verification`,
      template: './email-verification',
      context: {
        appUrl,
        appName,
        url,
        dateYear: new Date().getFullYear(),
      },
    });

    console.log(mailStatus);
  }
}
