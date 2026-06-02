import dotenv from "dotenv";
dotenv.config();

type MailtrapConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
};

const mailtrapConfig: MailtrapConfig = {
  host: process.env.MAILTRAP_HOST || "localhost",
  port: Number(process.env.MAILTRAP_PORT) || 1025,
  user: process.env.MAILTRAP_USER || "",
  pass: process.env.MAILTRAP_PASSWORD || "",
};

export default mailtrapConfig;
