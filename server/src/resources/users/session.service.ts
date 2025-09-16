import { Postgres } from "../../database/postgres.js";
import { config } from "../../config.js";
import bunyan from "bunyan";
import { Mailer } from "../../utils/mailer.js";
import { MailTemplate } from "../../templates/mailtemplate.js";
import { IpUtils } from "../../utils/iputils.js";
import { Capitalize } from "../../utils/capitalize.js";
import { User } from "../../types/user.js";
import { UuidUtils } from "../../utils/uuidutils.js";
import { ResponseMessage } from "../../types/reponse.js";
import bcrypt from "bcryptjs";

export class SessionService {
  log = bunyan.createLogger({ name: "Writeepi:Session", level: "debug" });

  async login(req: any): Promise<ResponseMessage> {
    if (req.body.email && req.body.password) {
      const email = req.body.email.toLowerCase();
      const res = await Postgres.queryOne<User>(
        `SELECT * FROM users WHERE email = $1`,
        [email],
      );

      if (res) {
        try {
          const pwdFromDb = res.password;
          const isValid = await bcrypt.compare(
            `${email}:${req.body.password}`,
            pwdFromDb ?? "",
          );

          if (isValid) {
            req.session.uid = res.uuid;
            req.session.level = res.level;
            req.session.name = res.firstname + " " + res.lastname;
            req.session.email = res.email;

            await Postgres.querySimple(
              `UPDATE users SET updated_at = now() WHERE uuid = $1`,
              [res.uuid],
            );

            this.log.debug(`User '${res.email}' has logged in successfully`);
            return {};
          }
        } catch (err: any) {
          this.log.error("Login critical error: " + err);
          return { error: "server error" };
        }
      }
      this.log.debug(
        `Failed connection attempt from ${req.body.email} '${IpUtils.getIp(req)}' (bad login or password)`,
      );
      return { error: "bad login or password" };
    }
    this.log.debug(
      `Failed connection attempt from '${IpUtils.getIp(req)}' (no login or password)`,
    );
    return { error: "no login or password" };
  }

  async allUsers(req: any): Promise<User[]> {
    const res = await Postgres.query<User>(
      `SELECT uuid, firstname, lastname, email, phone, creation, updated_at, active, level FROM users`,
    );
    this.log.debug(`Listing users from '${IpUtils.getIp(req)}'`);
    return res ?? [];
  }

  async user(req: any): Promise<User | undefined> {
    const uid = req.session.uid;
    if (UuidUtils.isValidUuid(uid)) {
      const res = await Postgres.queryOne<User>(
        `SELECT uuid, firstname, lastname, email, phone, active, level
                   FROM users
                  WHERE uuid = $1
                  LIMIT 1`,
        [uid],
      );
      this.log.debug(`Get user info '${IpUtils.getIp(req)}': ${uid}`);
      return res ?? undefined;
    }
    this.log.debug(`Cannot get user '${IpUtils.getIp(req)}' (no auth session)`);
    return undefined;
  }

  async updateUser(req: any): Promise<ResponseMessage> {
    const uid = req.params.uuid;
    const level = Number(req.body.level);
    const adminUid = req.session.uid;

    if (
      UuidUtils.isValidUuid(uid) &&
      Number.isInteger(level) &&
      level > 0 &&
      level < config.LEVEL.ADMIN &&
      uid !== adminUid
    ) {
      this.log.debug(`Admin ${adminUid} update from '${IpUtils.getIp(req)}'`);
      await Postgres.querySimple(
        `UPDATE users SET level = $1 WHERE uuid = $2`,
        [level, uid],
      );
      return {};
    }
    this.log.debug(
      `Failed admin update from '${IpUtils.getIp(req)}' (invalid data)`,
    );
    return { error: "Invalid data" };
  }

  async updateUserPhone(req: any): Promise<ResponseMessage> {
    const uid = req.params.uuid;
    const phone = req.body.phone;
    const adminUid = req.session.uid;
    const regexPhone =
      /^(?:(?:\+|00)33[\s.-]{0,3}(?:\(0\)[\s.-]{0,3})?|0)[1-9](?:(?:[\s.-]?\d{2}){4}|\d{2}(?:[\s.-]?\d{3}){2})$/u;

    if (
      UuidUtils.isValidUuid(uid) &&
      phone &&
      phone.match(regexPhone) &&
      phone.length > 4
    ) {
      this.log.debug(
        `Admin ${adminUid} phone update from '${IpUtils.getIp(req)}'`,
      );
      await Postgres.querySimple(
        `UPDATE users SET phone = $1 WHERE uuid = $2`,
        [phone, uid],
      );
      return {};
    }
    this.log.debug(
      `Failed admin phone update from '${IpUtils.getIp(req)}' (invalid data)`,
    );
    return { error: "Invalid data" };
  }

  async register(req: any): Promise<ResponseMessage> {
    if (
      req.body.firstname &&
      req.body.lastname &&
      req.body.email &&
      req.body.captcha &&
      req.body.password &&
      req.body.password.length > 3
    ) {
      const email = req.body.email.toLowerCase();
      const phone = "none";
      const regexNames =
        /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$/u;

      const emailValidated = email.match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}(\.[0-9]{1,3}){3}\])|(([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}))$/,
      );
      const namesValidated =
        req.body.firstname.match(regexNames) &&
        req.body.lastname.match(regexNames);

      if (!emailValidated) {
        this.log.debug(
          `Failed registration from '${IpUtils.getIp(req)}' (email not valid)`,
        );
        return { error: "Invalid email" };
      } else if (!namesValidated) {
        this.log.debug(
          `Failed registration from '${IpUtils.getIp(req)}' (first or lastname invalid)`,
        );
        return { error: "Invalid firstname or lastname" };
      } else if (
        req.session.captcha &&
        Capitalize.from(req.session.captcha) !==
          Capitalize.from(req.body.captcha)
      ) {
        this.log.debug(
          `Failed registration from '${IpUtils.getIp(req)}' (invalid captcha)`,
        );
        return { error: "Invalid captcha" };
      } else {
        const firstName = Capitalize.from(req.body.firstname);
        const lastName = Capitalize.from(req.body.lastname);

        const res = await Postgres.query<User>(
          `SELECT email FROM users WHERE email = $1`,
          [email],
        );

        if (res.length === 0) {
          this.log.debug(
            `Registration from '${IpUtils.getIp(req)}' email '${email}'`,
          );
          const newUuid = UuidUtils.v7();
          const recoverToken = UuidUtils.v7();
          const encryptedPwd = await bcrypt.hash(
            `${email}:${req.body.password}`,
            10,
          );

          await Postgres.createUser(
            firstName,
            lastName,
            email,
            req.body.password,
            phone,
            config.LEVEL.USER,
          );
          return {};
        } else {
          this.log.debug(
            `Failed registration from '${IpUtils.getIp(req)}' email '${email}' (already exists)`,
          );
          return { error: "User already exists" };
        }
      }
    }
    this.log.debug(
      `Failed registration from '${IpUtils.getIp(req)}' (missing data)`,
    );
    return { error: "Missing data" };
  }

  async reset(req: any) {
    if (req.body.email) {
      const rawEmail = req.body.email.toLowerCase();
      const res = await Postgres.queryOne<User>(
        `SELECT * FROM users WHERE email = $1`,
        [rawEmail],
      );
      if (res && res.resetdate) {
        const diff = Date.now() - res.resetdate.getTime();
        if (diff < 60 * 1000 * 5) {
          this.log.debug(
            `Failed password reset attempt from '${IpUtils.getIp(req)}' for ${rawEmail} (too early)`,
          );
          return { error: true, message: "Too early" };
        } else {
          this.log.debug(
            `Reset password request from '${IpUtils.getIp(req)}' for ${rawEmail}`,
          );
          const resetKey = UuidUtils.v7();
          await Postgres.querySimple(
            `UPDATE users SET resetkey = $1, resetdate = now() WHERE email = $2`,
            [resetKey, rawEmail],
          );
          const url = `${config.SITE_URL}/recover?token=${resetKey}`;
          const message = `Vous avez demandé à réinitialiser votre mot de passe. Veuillez suivre le lien suivant afin d'en choisir un nouveau : ${url}`;
          await Mailer.SendMail(
            rawEmail,
            "Réinitialisation du mot de passe Writeepi",
            message,
            MailTemplate.build(
              message,
              "",
              "Réinitialisation de votre mot de passe Writeepi",
              "Réinitialiser le mot de passe",
              url,
            ),
          );
          return { error: false };
        }
      }
      this.log.debug(
        `Failed password reset attempt from '${IpUtils.getIp(req)}' (email not found)`,
      );
      return { error: true, message: "Not found" };
    }
    this.log.debug(
      `Failed password reset attempt from '${IpUtils.getIp(req)}' (empty)`,
    );
    return { error: true, message: "Not found" };
  }

  async password(req: any) {
    if (
      req.body.email &&
      req.body.token &&
      req.body.password &&
      req.body.password.length > 3
    ) {
      const email = req.body.email.toLowerCase();
      const token = req.body.token;
      const res = await Postgres.queryOne<User>(
        `SELECT * FROM users WHERE email = $1 AND resetkey = $2`,
        [email, token],
      );

      if (res && res.resetdate) {
        const diff = Date.now() - res.resetdate.getTime();
        if (diff < 60 * 1000 * 60 * config.RESET_MAX_HOUR) {
          this.log.debug(
            `Password changed from '${IpUtils.getIp(req)}' for ${email}`,
          );
          const encryptedPwd = await bcrypt.hash(
            `${email}:${req.body.password}`,
            10,
          );
          const resetKey = UuidUtils.v7();
          await Postgres.querySimple(
            `UPDATE users SET resetkey = $1, password = $2 WHERE email = $3`,
            [resetKey, encryptedPwd, email],
          );

          const url = `${config.SITE_URL}/login`;
          const message1 = `Votre mot de passe a bien été modifié sur le portail Writeepi. Vous pouvez dès à présent vous connecter : ${url}`;
          const message2 = `Si vous n'êtes pas à l'initiative de ce changement, veuillez réinitialiser votre mot de passe immédiatement : ${config.SITE_URL}/recover`;
          await Mailer.SendMail(
            req.body.email,
            "Votre mot de passe Writeepi",
            message1,
            MailTemplate.build(
              message1,
              message2,
              "Votre mot de passe Writeepi",
              "Se connecter",
              `${config.SITE_URL}/recover`,
            ),
          );
          return { error: false };
        } else {
          this.log.debug(
            `Failed password update from '${IpUtils.getIp(req)}' (token expired)`,
          );
          return { error: true, message: "Token expired" };
        }
      }
      this.log.debug(
        `Failed password update from '${IpUtils.getIp(req)}' (email or token not found)`,
      );
      return { error: true, message: "Not found" };
    }
    this.log.debug(
      `Failed password update from '${IpUtils.getIp(req)}' (empty)`,
    );
    return { error: true, message: "Not found" };
  }

  async passwordAdmin(req: any) {
    if (req.level === undefined || req.level < config.LEVEL.ADMIN) {
      this.log.debug(
        `Failed password update by admin from '${IpUtils.getIp(req)}' (access denied)`,
      );
      return { error: true, message: "Access denied" };
    } else {
      if (req.body.email && req.body.password) {
        const email = req.body.email.toLowerCase();
        const res = await Postgres.query<User>(
          `SELECT * FROM users WHERE email = $1`,
          [email],
        );
        if (res.length > 0) {
          this.log.debug(
            `Password changed by admin from '${IpUtils.getIp(req)}' for ${email}`,
          );
          const encryptedPwd = await bcrypt.hash(
            `${email}:${req.body.password}`,
            10,
          );
          const resetKey = UuidUtils.v7();
          await Postgres.querySimple(
            `UPDATE users SET resetkey = $1, password = $2 WHERE email = $3`,
            [resetKey, encryptedPwd, email],
          );
          return { error: false };
        }
        this.log.debug(
          `Failed password update by admin from '${IpUtils.getIp(req)}' (email not found)`,
        );
        return { error: true, message: "Not found" };
      }
      this.log.debug(
        `Failed password update by admin from '${IpUtils.getIp(req)}' (empty)`,
      );
      return { error: true, message: "Not found" };
    }
  }

  async passwordUser(req: any) {
    if (req.level === undefined || req.level < config.LEVEL.USER) {
      this.log.debug(
        `Failed password update by user from '${IpUtils.getIp(req)}' (access denied)`,
      );
      return { error: true, message: "Access denied" };
    } else {
      if (req.body.email && req.body.password && req.body.oldPassword) {
        const email = req.body.email.toLowerCase();
        const res = await Postgres.queryOne<User>(
          `SELECT * FROM users WHERE email = $1`,
          [email],
        );
        if (res && res.password) {
          const isValid = await bcrypt.compare(
            `${email}:${req.body.oldPassword}`,
            res.password,
          );
          if (isValid) {
            this.log.debug(
              `Password changed by user from '${IpUtils.getIp(req)}' for ${email}`,
            );
            const encryptedPwd = await bcrypt.hash(
              `${email}:${req.body.password}`,
              10,
            );
            const resetKey = UuidUtils.v7();
            await Postgres.querySimple(
              `UPDATE users SET resetkey = $1, password = $2 WHERE email = $3`,
              [resetKey, encryptedPwd, email],
            );
            return { error: false };
          } else {
            this.log.debug(
              `Failed password update by user from '${IpUtils.getIp(req)}' (wrong password)`,
            );
            return { error: true, message: "Wrong password" };
          }
        }
        this.log.debug(
          `Failed password update by user from '${IpUtils.getIp(req)}' (email not found)`,
        );
        return { error: true, message: "Not found" };
      }
      this.log.debug(
        `Failed password update by user from '${IpUtils.getIp(req)}' (empty)`,
      );
      return { error: true, message: "Not found" };
    }
  }

  async simpleToken(req: any) {
    const uid = req.session.uid;
    const token = await bcrypt.hash(`uid${uid}-${UuidUtils.v7()}`, 4);
    return { token };
  }
}
