import { logger } from "./logger";

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  // Stub email sending for development
  logger.info("=== Mock Email Sending Started ===");
  logger.info(`To: ${options.to}`);
  logger.info(`Subject: ${options.subject}`);
  logger.info(`Text Content:\n${options.text}`);
  if (options.html) {
    logger.info(`HTML Content:\n${options.html}`);
  }
  logger.info("=== Mock Email Sending Finished ===");

  // In a production environment, you would integrate a mail transport service:
  // const transporter = nodemailer.createTransport({...});
  // await transporter.sendMail(options);
}
