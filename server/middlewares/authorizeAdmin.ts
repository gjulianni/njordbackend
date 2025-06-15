import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './verifyToken';

export const authorizeAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso restrito: apenas administradores.' });
      }
      next();
}