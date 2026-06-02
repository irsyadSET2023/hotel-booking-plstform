import nodemailer from "nodemailer";
import mailtrapConfig from "../config/mailtrap";

type Email = (params: {
  to: string[];
  cc?: string[];
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType: string;
  }>;
}) => Promise<void>;

const transport = nodemailer.createTransport({
  host: mailtrapConfig.host,
  port: mailtrapConfig.port,
  auth: {
    user: mailtrapConfig.user,
    pass: mailtrapConfig.pass,
  },
});

const devEmailService: Email = async ({
  to,
  cc,
  subject,
  html,
  attachments,
}) => {
  if (attachments) {
    const info = await transport.sendMail({
      from: process.env.MSH_SECRETARIAT_EMAIL,
      to: to,
      cc: cc,
      subject: subject,
      text: html,
      html: html,
      attachments,
    });
    console.log("Message sent: %s", info.messageId);
  } else {
    const info = await transport.sendMail({
      from: process.env.MSH_SECRETARIAT_EMAIL,
      to: to,
      subject: subject,
      text: html,
      html: html,
    });
    console.log("Message sent: %s", info.messageId);
  }
};

export const sendEmail = async ({
  to,
  cc,
  subject,
  html,
  attachments,
}: {
  to: string[];
  cc?: string[];
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType: string;
  }>;
}): Promise<void> => {
  try {
    await devEmailService({ to, cc, subject, html, attachments });
  } catch (error) {
    console.log(error);
  }
};

export default sendEmail;
