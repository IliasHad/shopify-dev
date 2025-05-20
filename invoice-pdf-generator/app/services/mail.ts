import nodemailer from "nodemailer";
import "dotenv/config";

const devClient = nodemailer.createTransport({
  host: "127.0.0.1",
  port: 1025,
  secure: false,
  tls: {
    rejectUnauthorized: false,
  },
});

const prodClient = nodemailer.createTransport({
  host: process.env.MAIL_SERVICE,
  port: parseInt(process.env.MAIL_SERVICE_PORT || "0"),
  auth: {
    pass: process.env.MAIL_SECRET,
    user: process.env.MAIL_SERVICE_USER,
  },
});

export const mailer =
  process.env.NODE_ENV === "development" ? devClient : prodClient;
