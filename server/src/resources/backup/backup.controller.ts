import { Router } from "express";
import { Authorized } from "../../utils/authorized.js";
import { BackupService } from "./backup.service.js";

const BackupController = Router();
const service = new BackupService();

BackupController.get("/", Authorized.USER, async (req, res) => {
  return await service.getbackuplist(req, res);
});

BackupController.get("/:uid", Authorized.USER, async (req, res) => {
  return await service.getbackup(req, res);
});

BackupController.post("/", Authorized.USER, async (req, res) => {
  return await service.savebackup(req, res);
});

BackupController.post("/create", Authorized.USER, async (req, res) => {
  return await service.createProject(req, res);
});

export { BackupController };
