import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

let sesClient: SESClient | null = null;
let initialized = false;

function getClient(): SESClient | null {
  if (!initialized) {
    initialized = true;
    const accessKeyId = process.env['AWS_SES_ACCESS_KEY_ID'];
    const secretAccessKey = process.env['AWS_SES_SECRET_ACCESS_KEY'];
    const region = process.env['AWS_SES_REGION'] || 'il-central-1';

    if (accessKeyId && secretAccessKey) {
      sesClient = new SESClient({
        region,
        credentials: { accessKeyId, secretAccessKey },
      });
    }
  }
  return sesClient;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function sendEmail(to: string, subject: string, text: string, html: string): Promise<void> {
  const from = process.env['SMTP_FROM'] || 'noreply@hitheal.org.il';
  const client = getClient();

  if (!client) {
    console.log(`[DEV EMAIL] To: ${to}, Subject: ${subject}, Body: ${text}`);
    return;
  }

  await client.send(new SendEmailCommand({
    Source: from,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject },
      Body: {
        Text: { Data: text },
        Html: { Data: html },
      },
    },
  }));
}

export async function sendWelcomeEmail(to: string, password: string): Promise<void> {
  await sendEmail(
    to,
    'Welcome to Sheba – Your account credentials',
    `Welcome to Sheba!\n\nYour account has been created.\nEmail: ${to}\nPassword: ${password}\n\nPlease change your password after first login.`,
    `<p>Welcome to Sheba!</p><p>Your account has been created.</p><p>Email: <strong>${escapeHtml(to)}</strong></p><p>Password: <strong>${escapeHtml(password)}</strong></p><p>Please change your password after first login.</p>`,
  );
}

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  await sendEmail(
    to,
    'Your verification code',
    `Your verification code is: ${code}\n\nThis code expires in 5 minutes.`,
    `<p>Your verification code is: <strong>${code}</strong></p><p>This code expires in 5 minutes.</p>`,
  );
}
