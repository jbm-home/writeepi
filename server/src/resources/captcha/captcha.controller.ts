import { Router } from "express";
import { Authorized } from "../../utils/authorized.js";
import { CaptchaService } from "./captcha.service.js";

const CaptchaController = Router();
const service = new CaptchaService();

CaptchaController.get("/", async (req, res): Promise<any> => {
  return res.send(await service.build(req));
});

export { CaptchaController };
