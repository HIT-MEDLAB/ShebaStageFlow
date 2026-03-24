import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;
let initialized = false;

function getTransporter(): Transporter | null {
  if (!initialized) {
    initialized = true;
    const smtpHost = process.env['SMTP_HOST'];
    const smtpPort = Number(process.env['SMTP_PORT'] || 587);
    const smtpUser = process.env['SMTP_USER'];
    const smtpPass = process.env['SMTP_PASS'];

    if (smtpHost && smtpUser && smtpPass) {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });
    }
  }
  return transporter;
}

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const smtpFrom = process.env['SMTP_FROM'] || 'noreply@sheba.co.il';
  const t = getTransporter();

  if (!t) {
    console.log(`[DEV OTP] Code for ${to}: ${code}`);
    return;
  }

  await t.sendMail({
    from: smtpFrom,
    to,
    subject: 'Your verification code',
    text: `Your verification code is: ${code}\n\nThis code expires in 5 minutes.`,
    html: `<p>Your verification code is: <strong>${code}</strong></p><p>This code expires in 5 minutes.</p>`,
  });
}
