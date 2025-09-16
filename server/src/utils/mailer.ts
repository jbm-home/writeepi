import bunyan from "bunyan";
import nodemailer from "nodemailer";
import { config } from "../config.js";
import SMTPTransport from "nodemailer/lib/smtp-transport/index.js";

export class Mailer {
  static log = bunyan.createLogger({ name: "Mailer", level: "debug" });

  static async SendMail(
    to: string,
    subject: string,
    messageText: string,
    messageHtml: string,
  ) {
    if (!config.EMAIL.ENABLED) {
      this.log.info("Message not sent: disabled");
      return true;
    }

    const options: SMTPTransport.Options = {
      host: config.EMAIL.HOST,
      port: config.EMAIL.PORT,
      secure: config.EMAIL.SECURE,
      requireTLS: config.EMAIL.TLS,
      auth: {
        user: config.EMAIL.LOGIN,
        pass: config.EMAIL.PASSWORD,
      },
      logger: true,
    };

    const transporter = nodemailer.createTransport(options);

    try {
      const info = await transporter.sendMail({
        from: config.EMAIL.SENDER,
        to,
        subject,
        text: messageText,
        html: messageHtml,
      });
      this.log.info("Message sent: %s", info.response);
    } catch (error) {
      this.log.error(error);
      return false;
    }
    return true;
  }
}
