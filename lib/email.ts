import nodemailer from 'nodemailer';

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 0);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !port || !user || !pass || !from) {
    throw new Error('SMTP configuration is missing');
  }

  return { host, port, user, pass, from };
}

function createTransporter() {
  const { host, port, user, pass } = getSmtpConfig();
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

export async function sendVerificationEmail(email: string, verifyUrl: string) {
  const { from } = getSmtpConfig();
  const transporter = createTransporter();

  await transporter.sendMail({
    from,
    to: email,
    subject: 'Verify your email address',
    text: [
      'Welcome to UniWork!',
      '',
      'Please verify your email address by opening the link below:',
      verifyUrl,
      '',
      'This verification link expires in 24 hours.'
    ].join('\n')
  });
}
