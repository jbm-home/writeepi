import bunyan from "bunyan";
import { NextFunction, Request, Response } from "express";

export const ExceptionsHandler: any = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const log = bunyan.createLogger({
    name: "Writeepi:ExceptionsHandler",
    level: "debug",
  });

  if (res.headersSent) {
    return next(err);
  }

  if (err.status && err.error) {
    return res.status(err.status).json({ error: err.error });
  }

  if (err.statusCode == 400) {
    log.warn("Bad request: " + err);
    return res.status(400).json({ error: "Bad request", message: err.type });
  }

  log.error("Server error: " + err);
  return res.status(500).json({ error: "Server error", message: err });
};
