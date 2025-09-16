import { Router } from "express";
import { Authorized } from "../../utils/authorized.js";
import { ExportService } from "./export.service.js";

const ExportController = Router();
const service = new ExportService();

ExportController.get(
  "/epub/:uid",
  Authorized.USER,
  async (req, res): Promise<any> => {
    return await service.getEpub(req, res);
  },
);

ExportController.get(
  "/pdf/:uid",
  Authorized.USER,
  async (req, res): Promise<any> => {
    return await service.getPdf(req, res);
  },
);

ExportController.get(
  "/docx/:uid",
  Authorized.USER,
  async (req, res): Promise<any> => {
    return await service.getDocx(req, res);
  },
);

export { ExportController };
