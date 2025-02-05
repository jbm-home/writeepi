import bunyan from "bunyan";
import { IpUtils } from "./iputils.js";
import { config } from "../config.js";

export class Authorized {
    static log = bunyan.createLogger({ name: "Writeepi:Authorized", level: "debug" });

    static ADMIN = (req: any, res: any, next: any) => {
        if (req.session
            && req.session.level
            && Number.isInteger(Number(req.session.level))
            && req.session.level >= config.LEVEL.ADMIN) {
            next();
        } else {
            this.log.warn(`Failed ADMIN request on '${req.path}' by '${IpUtils.getIp(req)}'`);
            res.status(401).json({ error: true, message: 'Unauthorized' });
        }
    }

    static USER = (req: any, res: any, next: any) => {
        if (req.session
            && req.session.level
            && Number.isInteger(Number(req.session.level))
            && req.session.level >= config.LEVEL.USER) {
            next();
        } else {
            this.log.debug(`Failed USER request on '${req.path}' by '${IpUtils.getIp(req)}'`);
            res.status(401).json({ error: true, message: 'Unauthorized' });
        }
    }

    static GUESTONLY = (req: any, res: any, next: any) => {
        if (!req.session
            || !req.session.level
            || !Number.isInteger(Number(req.session.level))
            || req.session.level === 0 || req.session.level === undefined) {
            next();
        } else {
            this.log.trace(`Failed GUESTONLY only request on '${req.path}' by '${IpUtils.getIp(req)}'`);
            res.status(401).json({ error: true, message: 'Unauthorized' });
        }
    }
}
