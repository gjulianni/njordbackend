import { Request, Response } from 'express';
import User from '../../models/user';
import CsvData from '../../models/csvData';
import dotenv from 'dotenv';

dotenv.config();

export const countDocuments = async (req: Request, res: Response) => {
    const meteoCount = await CsvData.countDocuments();
    const userCount = await User.countDocuments();
    return res.status(200).json({
        meteoCount,
        userCount
    });
};