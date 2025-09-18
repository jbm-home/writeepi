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
    const email = req.body?.email?.toLowerCase?.();
    const ip = IpUtils.getIp(req);

    this.log.debug(`Password reset requested for ${email}`);

    const emailValidated = email && email.match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}(\.[0-9]{1,3}){3}\])|(([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}))$/,
    );

    if (!emailValidated) {
      this.log.debug(`Failed password reset attempt from '${ip}' (invalid email)`);
      return { error: "Invalid email" };
    }

    // Check user
    const user = await Postgres.queryOne<User>(
      `SELECT * FROM users WHERE email = $1`,
      [email],
    );

    if (!user) {
      this.log.debug(`Failed password reset attempt from '${ip}' (email not found: ${email})`);
      return {};
    }

    // Too early request: 1 minute
    if (user.resetdate) {
      const diffMs = Date.now() - user.resetdate.getTime();
      if (diffMs < 1 * 60 * 1000) {
        this.log.debug(`Failed password reset attempt from '${ip}' for ${email} (too early)`);
        return { error: "Too early" };
      }
    }

    // Generate new reset key
    const resetKey = UuidUtils.v7();
    await Postgres.querySimple(
      `UPDATE users SET resetkey = $1, resetdate = now() WHERE email = $2`,
      [resetKey, email],
    );

    // Recover uri
    const url = `${config.SITE_URL}/?recoverToken=${resetKey}`;
    const plainMessage = `Vous avez demandé à réinitialiser votre mot de passe. 
Veuillez suivre le lien suivant afin d'en choisir un nouveau : ${url}`;

    // Send mail
    await Mailer.SendMail(
      email,
      "Réinitialisation du mot de passe Writeepi",
      plainMessage,
      MailTemplate.build(
        plainMessage,
        "",
        "Réinitialisation de votre mot de passe Writeepi",
        "Réinitialiser le mot de passe",
        url,
      ),
    );

    this.log.debug(`Password reset email sent to ${email} from '${ip}'`);
    return {};
  }

  async password(req: any) {
    const email = req.body?.email?.toLowerCase?.();
    const token = req.body?.token;
    const password = req.body?.password;
    const ip = IpUtils.getIp(req);

    // check
    if (!email || !token || !password || password.length <= 3) {
      this.log.debug(`Failed password update from '${ip}' (missing fields)`);
      return { error: "Missing fields" };
    }

    // get user
    const user = await Postgres.queryOne<User>(
      `SELECT * FROM users WHERE email = $1 AND resetkey = $2`,
      [email, token],
    );

    if (!user || !user.resetdate) {
      this.log.debug(`Failed password update from '${ip}' (email or token not found: ${email})`);
      return { error: "Not found or invalid token" };
    }

    // is token expired?
    const diffMs = Date.now() - user.resetdate.getTime();
    const maxLifetimeMs = config.RESET_MAX_HOUR * 60 * 60 * 1000;
    if (diffMs > maxLifetimeMs) {
      this.log.debug(`Failed password update from '${ip}' for ${email} (token expired)`);
      return { error: "Token expired" };
    }

    // update password
    const encryptedPwd = await bcrypt.hash(`${email}:${password}`, 10);
    const newResetKey = UuidUtils.v7();

    await Postgres.querySimple(
      `UPDATE users SET resetkey = $1, password = $2 WHERE email = $3`,
      [newResetKey, encryptedPwd, email],
    );

    // send mail
    const loginUrl = `${config.SITE_URL}`;
    const recoverUrl = `${config.SITE_URL}/?recover=true`;

    const message1 = `Votre mot de passe a bien été modifié sur Writeepi. Vous pouvez dès à présent vous connecter : ${loginUrl}`;
    const message2 = `Si vous n'êtes pas à l'initiative de ce changement, veuillez réinitialiser votre mot de passe immédiatement : ${recoverUrl}`;

    await Mailer.SendMail(
      email,
      "Votre mot de passe Writeepi",
      message1,
      MailTemplate.build(
        message1,
        message2,
        "Votre mot de passe Writeepi",
        "Se connecter",
        recoverUrl,
      ),
    );

    this.log.debug(`Password changed for ${email} from '${ip}'`);
    return {};
  }

  async simpleToken(req: any) {
    const uid = req.session.uid;
    const token = await bcrypt.hash(`uid${uid}-${UuidUtils.v7()}`, 4);
    return { token };
  }
}
