import { Router } from 'express'
import { Authorized } from '../../utils/authorized.js';
import { BackupService } from './backup.service.js';

const BackupController = Router();
const service = new BackupService();

BackupController.get('/content', Authorized.USER, async (req, res) => {
    return await service.getbackuplist(req, res);
});

BackupController.get('/content/:uid', Authorized.USER, async (req, res) => {
    return await service.getbackup(req, res);
});

BackupController.post('/content', Authorized.USER, async (req, res) => {
    return await service.savebackup(req, res);
});

export { BackupController }
