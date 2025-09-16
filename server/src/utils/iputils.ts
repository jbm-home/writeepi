import { Request } from "express";

export class IpUtils {
  static getIp(req: Request) {
    return req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  }
}
