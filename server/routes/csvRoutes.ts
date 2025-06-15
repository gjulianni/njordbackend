import express from 'express';
import { getCsvForDashboard, uploadCsvData, getLastCsvData } from '../controllers/csvController';

const router = express.Router();

router.post('/upload', uploadCsvData); 
router.get("/dashboard", getCsvForDashboard);
router.get('/last', getLastCsvData);

export default router;
