import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../../config/env.js';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: false,
  });

  async send(to: string, subject: string, html: string): Promise<void> {
    if (env.isTest) return;
    try {
      await this.transporter.sendMail({ from: env.mailFrom, to, subject, html });
    } catch (error) {
      this.logger.error(`Failed to send mail to ${to}`, error as Error);
    }
  }
}
