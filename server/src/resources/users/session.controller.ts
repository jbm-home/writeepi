import { Router } from "express";
import { Authorized } from "../../utils/authorized.js";
import { SessionService } from "./session.service.js";

const SessionController = Router();
const service = new SessionService();

SessionController.get("/", (req, res): any => {
  req.session.resetMaxAge();
  return res.status(200).json(req.session);
});

SessionController.get(
  "/user",
  Authorized.USER,
  async (req, res): Promise<any> => {
    return res.status(200).json(await service.user(req));
  },
);

SessionController.get(
  "/users",
  Authorized.ADMIN,
  async (req, res): Promise<any> => {
    return res.status(200).json(await service.allUsers(req));
  },
);

SessionController.get(
  "/token",
  Authorized.USER,
  async (req, res): Promise<any> => {
    return res.status(200).json(await service.simpleToken(req));
  },
);

SessionController.put(
  "/users/:uuid",
  Authorized.ADMIN,
  async (req, res): Promise<any> => {
    return res.status(200).json(await service.updateUser(req));
  },
);

SessionController.put(
  "/users/phone/:uuid",
  Authorized.ADMIN,
  async (req, res): Promise<any> => {
    return res.status(200).json(await service.updateUserPhone(req));
  },
);

SessionController.post(
  "/login",
  Authorized.GUESTONLY,
  async (req, res): Promise<any> => {
    return res.status(200).json(await service.login(req));
  },
);

SessionController.post(
  "/register",
  Authorized.GUESTONLY,
  async (req, res): Promise<any> => {
    return res.status(200).json(await service.register(req));
  },
);

SessionController.post(
  "/reset",
  Authorized.GUESTONLY,
  async (req, res): Promise<any> => {
    return res.status(200).json(await service.reset(req));
  },
);

SessionController.post(
  "/password",
  Authorized.GUESTONLY,
  async (req, res): Promise<any> => {
    return res.status(200).json(await service.password(req));
  },
);

SessionController.post(
  "/password/admin",
  Authorized.ADMIN,
  async (req, res): Promise<any> => {
    return res.status(200).json(await service.passwordAdmin(req));
  },
);

SessionController.post(
  "/password/user",
  Authorized.USER,
  async (req, res): Promise<any> => {
    return res.status(200).json(await service.passwordUser(req));
  },
);

SessionController.delete("/", (req, res) => {
  req.session.destroy((err) => {
    return res.status(200).json(req.session);
  });
});

export { SessionController };
