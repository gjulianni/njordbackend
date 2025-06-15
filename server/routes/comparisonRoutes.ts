import express from 'express';
import { compareData } from '../controllers/comparisonController';

const comparisonRouter = express.Router();

comparisonRouter.get('/', compareData);

export default comparisonRouter;