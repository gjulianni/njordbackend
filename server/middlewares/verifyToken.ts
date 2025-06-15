import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: { _id: string, role: string }; 

}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.auth_token;
  
  if (!token) {
    return res.status(401).json({ message: 'Token de autenticação não encontrado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { _id: string, role: string };

    req.user = decoded; 
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido ou expirado' });
  }
};
