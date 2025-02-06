import { MariaDb } from "../../database/mariadb.js";
import CryptoJS from "crypto-js";
import { config } from "../../config.js";
import bunyan from "bunyan";
import { Mailer } from "../../utils/mailer.js";
import { mails } from "../../templates/mails.js";
import { IpUtils } from "../../utils/iputils.js";
import { Capitalize } from '../../utils/capitalize.js';
import { User } from "../../types/user.js";
import { UuidUtils } from '../../utils/uuidutils.js';
import { ResponseMessage } from "../../types/reponse.js";

export class SessionService {
    log = bunyan.createLogger({ name: "Writeepi:Session", level: "debug" });

    async login(req: any): Promise<ResponseMessage> {
        if (req.body.email !== undefined && req.body.password !== undefined) {
            const email = req.body.email.toLowerCase();
            const res = await MariaDb.request(`SELECT * FROM \`users\` WHERE \`email\` = ${await MariaDb.escape(email)};`);
            if (res.length > 0) {
                try {
                    const bytes = CryptoJS.AES.decrypt(res[0].password, config.DB_SECRET);
                    const pwdFromDb = bytes.toString(CryptoJS.enc.Utf8);

                    if (pwdFromDb === `${email}:${req.body.password}`) {
                        req.session.uid = res[0].uuid;
                        req.session.level = res[0].level;
                        req.session.name = res[0].firstname + ' ' + res[0].lastname;
                        req.session.email = res[0].email;
                        await MariaDb.request(`UPDATE \`users\` SET \`update\` = current_timestamp() WHERE \`uuid\` = ${await MariaDb.escape(res[0].uuid)} LIMIT 1;`);
                        this.log.debug(`User '${res[0].email}' has logged in successfully`);
                        return { };
                    }
                } catch (err: any) {
                    this.log.error('Login critical error: ' + err);
                    return { error: 'Login critical error' };
                }
            }
            this.log.debug(`Failed connection attempt from ${req.body.email} '${IpUtils.getIp(req)}' (bad login or password)`);
            return { error: 'bad login or password' };
        }
        this.log.debug(`Failed connection attempt from '${IpUtils.getIp(req)}' (no login or password)`);
        return { error: 'no login or password' };
    }

    async allUsers(req: any): Promise<User[]> {
        let users: User[] = [];
        const res = await MariaDb.request(`SELECT * FROM \`users\` WHERE 1`);
        this.log.debug(`Listing users from '${IpUtils.getIp(req)}'`);
        if (res.length > 0) {
            for (let i = 0; i < res.length; i++) {
                users.push({
                    uuid: res[i].uuid,
                    firstname: res[i].firstname,
                    lastname: res[i].lastname,
                    email: res[i].email,
                    phone: res[i].phone,
                    creation: res[i].creation,
                    update: res[i].update,
                    active: res[i].active,
                    level: res[i].level,
                });
            }
        }
        return users;
    }

    async user(req: any): Promise<User | undefined> {
        const uid = req.session.uid;
        if (UuidUtils.isValidUuid(uid)) {
            const res = await MariaDb.request(`SELECT * FROM \`users\` WHERE \`uuid\` = '${uid}' LIMIT 1;`);
            this.log.debug(`Get user info '${IpUtils.getIp(req)}': ${uid}`);
            if (res.length > 0) {
                const user: User = {
                    uuid: uid,
                    firstname: res[0].firstname,
                    lastname: res[0].lastname,
                    email: res[0].email,
                    phone: res[0].phone,
                    active: res[0].active,
                    level: res[0].level,
                }
                return user;
            }
        }
        this.log.debug(`Cannot get user '${IpUtils.getIp(req)}' (no auth session)`);
        return undefined;
    }

    async updateUser(req: any): Promise<ResponseMessage> {
        const uid = req.params.uuid;
        const level = Number(req.body.level);
        const adminUid = req.session.uid;
        if (UuidUtils.isValidUuid(uid) && Number.isInteger(level) && level > 0 && level < config.LEVEL.ADMIN && uid !== adminUid) {
            this.log.debug(`Admin ${adminUid} update from '${IpUtils.getIp(req)}'`);
            await MariaDb.request(`UPDATE \`users\` SET \`level\` = ${level} WHERE \`uuid\` = '${uid}' LIMIT 1;`);
            return { };
        }
        this.log.debug(`Failed admin update from '${IpUtils.getIp(req)}' (invalid data)`);
        return { error: 'Invalid data'};
    }

    async updateUserPhone(req: any): Promise<ResponseMessage> {
        const uid = req.params.uuid;
        const phone = await MariaDb.escape(req.body.phone);
        const adminUid = req.session.uid;
        const regexPhone = /^(?:(?:\+|00)33[\s.-]{0,3}(?:\(0\)[\s.-]{0,3})?|0)[1-9](?:(?:[\s.-]?\d{2}){4}|\d{2}(?:[\s.-]?\d{3}){2})$/u;
        if (UuidUtils.isValidUuid(uid) && req.body.phone && req.body.phone.match(regexPhone) && req.body.phone.length > 4) {
            this.log.debug(`Admin ${adminUid} phone update from '${IpUtils.getIp(req)}'`);
            await MariaDb.request(`UPDATE \`users\` SET \`phone\` = ${phone} WHERE \`uuid\` = '${uid}' LIMIT 1;`);
            return { };
        }
        this.log.debug(`Failed admin phone update from '${IpUtils.getIp(req)}' (invalid data)`);
        return { error: 'Invalid data'};
    }

    async register(req: any): Promise<ResponseMessage> {
        if (req.body.firstname !== undefined
            && req.body.lastname !== undefined
            && req.body.email !== undefined
            && req.body.phone !== undefined
            && req.body.password !== undefined
            && req.body.password.length > 3) {
            const email = req.body.email.toLowerCase();
            const phone = req.body.phone;
            const regexNames = /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$/u;
            const regexPhone = /^(?:(?:\+|00)33[\s.-]{0,3}(?:\(0\)[\s.-]{0,3})?|0)[1-9](?:(?:[\s.-]?\d{2}){4}|\d{2}(?:[\s.-]?\d{3}){2})$/u;
            const emailValidated = email.match(
                /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
            const phoneValidated = phone.match(regexPhone);
            const namesValidated = req.body.firstname.match(regexNames) && req.body.lastname.match(regexNames);
            if (!emailValidated) {
                this.log.debug(`Failed registration from '${IpUtils.getIp(req)}' (email not valid)`);
                return { error: 'Invalid email' };
            } else if (!phoneValidated) {
                this.log.debug(`Failed registration from '${IpUtils.getIp(req)}' (phone number not valid)`);
                return { error: 'Invalid phone number' };
            } else if (!namesValidated) {
                this.log.debug(`Failed registration from '${IpUtils.getIp(req)}' (first or lastname invalid)`);
                return { error: 'Invalid firstname or lastname' };
            } else {
                const firstName = Capitalize.from(req.body.firstname);
                const lastName = Capitalize.from(req.body.lastname);
                const res = await MariaDb.request(`SELECT \`email\` FROM \`users\`;`);
                if (res.findIndex((e: any) => e.email === email) < 0) {
                    this.log.debug(`Registration from '${IpUtils.getIp(req)}' email '${email}'`);
                    const created = await MariaDb.createUser(firstName, lastName, email, req.body.password, phone, config.LEVEL.USER);
                    if (created) {
                        return { };
                    } else {
                        return { error: 'Error when trying to create account (invalid email?)' };
                    }
                } else {
                    this.log.debug(`Failed registration from '${IpUtils.getIp(req)}' email '${email}' (already exists)`);
                    return { error: 'User already exists' };
                }
            }
        }
        this.log.debug(`Failed registration from '${IpUtils.getIp(req)}' (missing data)`);
        return { error: 'Missing data' };
    }

    async reset(req: any) {
        if (req.body.email !== undefined) {
            const rawEmail = req.body.email.toLowerCase();
            const email = await MariaDb.escape(rawEmail);
            const res = await MariaDb.request(`SELECT * FROM \`users\` WHERE \`email\` = ${email};`);
            if (res.length > 0) {
                const resetDate: Date = res[0].resetdate;
                const diff = Date.now() - resetDate.getTime();
                if (diff < (60 * 1000 * 5)) { // min 5 minutes
                    this.log.debug(`Failed password reset attempt from '${IpUtils.getIp(req)}' for ${email} (too early)`);
                    return { error: true, message: 'Too early' }
                } else {
                    this.log.debug(`Reset password request from '${IpUtils.getIp(req)}' for ${email}`);
                    const resetKey = UuidUtils.v7();
                    await MariaDb.request(`UPDATE \`users\` SET \`resetkey\` = '${resetKey}', \`resetdate\` = current_timestamp() WHERE \`email\` = ${email} LIMIT 1;`);
                    const url = `${config.SITE_URL}/recover?token=${resetKey}`;
                    const message = `Vous avez demandé à réinitialiser votre mot de passe. Veuillez suivre le lien suivant afin d'en choisir un nouveau : ${url}`;
                    await Mailer.SendMail(rawEmail, 'Réinitialisation du mot de passe Writeepi', message, mails.template(message, '', 'Réinitialisation de votre mot de passe Writeepi(intes)', 'Réinitialiser le mot de passe', url));
                    return { error: false }
                }
            }
            this.log.debug(`Failed password reset attempt from '${IpUtils.getIp(req)}' (email not found)`);
            return { error: true, message: 'Not found' }
        }
        this.log.debug(`Failed password reset attempt from '${IpUtils.getIp(req)}' (empty)`);
        return { error: true, message: 'Not found' }
    }

    async password(req: any) {
        if (req.body.email !== undefined && req.body.token !== undefined && req.body.password !== undefined && req.body.password.length > 3) {
            const email = await MariaDb.escape(req.body.email.toLowerCase());
            const token = await MariaDb.escape(req.body.token);
            const password = await MariaDb.escape(req.body.password);
            const res = await MariaDb.request(`SELECT * FROM \`users\` WHERE \`email\` = ${email} AND \`resetkey\` = ${token}`);
            if (res.length > 0) {
                const resetDate: Date = res[0].resetdate;
                const diff = Date.now() - resetDate.getTime();
                if (diff < (60 * 1000 * 60 * config.RESET_MAX_HOUR)) {
                    this.log.debug(`Password changed from '${IpUtils.getIp(req)}' for ${email}`);
                    const encryptedPwd = CryptoJS.AES.encrypt(`${res[0].email}:${req.body.password}`, config.DB_SECRET).toString();
                    const resetKey = UuidUtils.v7();
                    await MariaDb.request(`UPDATE \`users\` SET \`resetkey\` = '${resetKey}', \`password\` = '${encryptedPwd}' WHERE \`email\` = ${email} LIMIT 1;`);
                    // await MariaDb.request(`UPDATE \`users\` SET \`resetkey\` = NULL, \`password\` = '${encryptedPwd}' WHERE \`email\` = ${email} LIMIT 1;`);

                    const url = `${config.SITE_URL}/login`;
                    const message1 = `Votre mot de passe à bien été modifié sur le portail Writeepi(intes). Vous pouvez dés à présent vous connecter en suivant le lien suivant : ${config.SITE_URL}/login`;
                    const message2 = `Si vous n'êtes pas à l'initiative de ce changement, veuillez réinitialiser votre mot de passe immédiatement à cette adresse : ${config.SITE_URL}/recover`;
                    await Mailer.SendMail(req.body.email, 'Votre mot de passe Writeepi', message1, mails.template(message1, message2, 'Votre mot de passe Writeepi(intes)', 'Se connecter', `${config.SITE_URL}/recover`));
                    return { error: false }
                } else {
                    this.log.debug(`Failed password update from '${IpUtils.getIp(req)}' (token expired)`);
                    return { error: true, message: 'Token expired' }
                }
            }
            this.log.debug(`Failed password update from '${IpUtils.getIp(req)}' (email or token not found)`);
            return { error: true, message: 'Not found' }
        }
        this.log.debug(`Failed password update from '${IpUtils.getIp(req)}' (empty)`);
        return { error: true, message: 'Not found' }
    }

    async passwordAdmin(req: any) {
        if (req.level === undefined || req.level < config.LEVEL.ADMIN) {
            this.log.debug(`Failed password update by admin from '${IpUtils.getIp(req)}' (access denied)`);
            return { error: true, message: 'Access denied' }
        } else {
            if (req.body.email !== undefined && req.body.password !== undefined) {
                const email = await MariaDb.escape(req.body.email.toLowerCase());
                const res = await MariaDb.request(`SELECT * FROM \`users\` WHERE \`email\` = ${email}`);
                if (res.length > 0) {
                    this.log.debug(`Password changed by admin from '${IpUtils.getIp(req)}' for ${email}`);
                    const encryptedPwd = CryptoJS.AES.encrypt(`${res[0].email}:${req.body.password}`, config.DB_SECRET).toString();
                    const resetKey = UuidUtils.v7();
                    await MariaDb.request(`UPDATE \`users\` SET \`resetkey\` = '${resetKey}', \`password\` = '${encryptedPwd}' WHERE \`email\` = ${email} LIMIT 1;`);
                    // await MariaDb.request(`UPDATE \`users\` SET \`resetkey\` = NULL, \`password\` = '${encryptedPwd}' WHERE \`email\` = ${email} LIMIT 1;`);
                    return { error: false }
                }
                this.log.debug(`Failed password update by admin from '${IpUtils.getIp(req)}' (email not found)`);
                return { error: true, message: 'Not found' }
            }
            this.log.debug(`Failed password update by admin from '${IpUtils.getIp(req)}' (empty)`);
            return { error: true, message: 'Not found' }
        }
    }

    async passwordUser(req: any) {
        if (req.level === undefined || req.level < config.LEVEL.USER) {
            this.log.debug(`Failed password update by user from '${IpUtils.getIp(req)}' (access denied)`);
            return { error: true, message: 'Access denied' }
        } else {
            if (req.body.email !== undefined && req.body.password !== undefined && req.body.oldPassword !== undefined) {
                const email = await MariaDb.escape(req.body.email.toLowerCase());
                const res = await MariaDb.request(`SELECT * FROM \`users\` WHERE \`email\` = ${email}`);
                if (res.length > 0) {
                    const bytes = CryptoJS.AES.decrypt(res[0].password, config.DB_SECRET);
                    const pwdFromDb = bytes.toString(CryptoJS.enc.Utf8);

                    if (pwdFromDb === `${req.body.email.toLowerCase()}:${req.body.oldPassword}`) {
                        this.log.debug(`Password changed by user from '${IpUtils.getIp(req)}' for ${email}`);
                        const encryptedPwd = CryptoJS.AES.encrypt(`${res[0].email}:${req.body.password}`, config.DB_SECRET).toString();
                        const resetKey = UuidUtils.v7();
                        await MariaDb.request(`UPDATE \`users\` SET \`resetkey\` = '${resetKey}', \`password\` = '${encryptedPwd}' WHERE \`email\` = ${email} LIMIT 1;`);
                        // await MariaDb.request(`UPDATE \`users\` SET \`resetkey\` = NULL, \`password\` = '${encryptedPwd}' WHERE \`email\` = ${email} LIMIT 1;`);
                        return { error: false }
                    } else {
                        this.log.debug(`Failed password update by user from '${IpUtils.getIp(req)}' (wrong password)`);
                        return { error: true, message: 'Wrong password' }
                    }
                }
                this.log.debug(`Failed password update by user from '${IpUtils.getIp(req)}' (email not found)`);
                return { error: true, message: 'Not found' }
            }
            this.log.debug(`Failed password update by user from '${IpUtils.getIp(req)}' (empty)`);
            return { error: true, message: 'Not found' }
        }
    }

    async simpleToken(req: any) {
        const uid = req.session.uid;
        const token = CryptoJS.SHA1(`uid${uid}-${UuidUtils.v7()}`).toString();
        return { token };
    }
}