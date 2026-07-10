import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from '../common/utils/logger';

const smtp = config.smtp;

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!smtp.user || !smtp.pass) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
      auth: { user: smtp.user, pass: smtp.pass },
    });
  }
  return transporter;
}

export class EmailService {
  static isConfigured(): boolean {
    return Boolean(smtp.user && smtp.pass);
  }

  static async sendOtpEmail(to: string, subject: string, otp: string, purpose: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">MyEasyHand</h2>
        <p>Your ${purpose} code is:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${otp}</p>
        <p style="color: #666;">This code expires in ${config.otp.expiryMinutes} minutes. Do not share it with anyone.</p>
      </div>
    `;

    const transport = getTransporter();
    if (!transport) {
      logger.info(`[Email not configured] OTP for ${to} (${purpose}): ${otp}`);
      return;
    }

    await transport.sendMail({
      from: smtp.from,
      to,
      subject,
      html,
      text: `Your MyEasyHand ${purpose} code is ${otp}. It expires in ${config.otp.expiryMinutes} minutes.`,
    });
    logger.info(`OTP email sent to ${to} (${purpose})`);
  }
}
