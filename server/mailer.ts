import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.spacemail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const transporter = getTransporter();
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || 'help@studyweave.com';
    const fromName = (process.env.EMAIL_FROM_NAME || 'KulLoop · Family Ritual Service').replace(/['"]/g, '');

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to,
      subject,
      html,
    });
    console.log('[SMTP Delivery Success] Message sent to %s with ID: %s', to, info.messageId);
    return true;
  } catch (error) {
    console.error('[SMTP Delivery Error] Failed to send email to %s:', to, error);
    return false;
  }
}
