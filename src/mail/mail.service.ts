import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { User } from '../user/user.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) { }



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


  async sendTestEmail(to: string) {
    const appUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const appName = this.configService.get('APP_NAME') || 'FabSpaceAI';

    await this.mailerService.sendMail({
      to,
      subject: 'FabSpaceAI Test Email',
      template: './email-verification', // reuse existing template
      context: {
        appUrl,
        appName,
        url: `${appUrl}/test`,
        dateYear: new Date().getFullYear(),
      },
    });

    return true;
  }


  async sendQuoteSubmittedToPM(
    email: string,
    name: string,
    quoteId: string,
    quoteName: string,
  ) {
    const appUrl = this.configService.get('FRONTEND_URL');

    const quoteUrl = `${appUrl}/dashboard/quotes/${quoteId}`;
    console.log("Sending quote submission email to:", email);
    await this.mailerService.sendMail({
      to: email,
      subject: 'Your Quote Has Been Submitted – FabSpaceAI',
      template: './quote-submitted',
      context: {
        name,
        quoteName,
        quoteUrl,
      },
    });

  }


  async notifyEMSNewQuote(
    email: string,
    quoteId: string,
    quoteName: string,
  ) {
    const appUrl = this.configService.get('FRONTEND_URL');
    const quoteUrl = `${appUrl}/ems/quotes/${quoteId}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'New Quote Assigned – FabSpaceAI',
      template: './ems-new-quote',
      context: {
        quoteId,
        quoteName,
        quoteUrl,
      },
    });
  }


  async notifyPMBidReceived(
    email: string,
    name: string,
    quoteId: string,
    quoteName: string,
  ) {
    const appUrl = this.configService.get('FRONTEND_URL');
    const quoteUrl = `${appUrl}/dashboard/quotes/${quoteId}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'New Bid Received – FabSpaceAI',
      template: './bid-received',
      context: {
        name,
        quoteId,
        quoteName,
        quoteUrl,
      },
    });
  }

  async notifyDirectEMSQuote(
    email: string,
    quoteId: string,
    quoteName: string,
  ) {
    const appUrl = this.configService.get('FRONTEND_URL');
    const quoteUrl = `${appUrl}/ems/quotes/${quoteId}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'New Direct Quote Request – FabSpaceAI',
      template: './direct-rfq',
      context: {
        quoteId,
        quoteName,
        quoteUrl,
      },
    });
  }

}


