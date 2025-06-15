import { Request, Response } from 'express';
import { sendRecoveryEmail } from '../services/email';
import User from '../models/user';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const createRecoverToken = async (req: Request, res: Response) => {
    try {
  
      const { email } = req.body;
      if(!email) {
        return res.status(400).json({ message: 'Forneça o e-mail'})
      }
  
      const emailExiste = await User.findOne({ email });
      if(!emailExiste) {
        return res.status(200).json({ message: 'Se o e-mail existir, você receberá um link para recuperação.'})
      }

      const token = jwt.sign({email: emailExiste.email}, process.env.JWT_SECRET!, {expiresIn: '15m'});

      emailExiste.resetToken = token;
      emailExiste.resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
      await emailExiste.save();

      await sendRecoveryEmail(email, token);
      return res.status(200).json({ message: 'Se o e-mail existir, você receberá um link para recuperação.'})
    } catch (err) {
      console.error('Erro ao criar token de recuperação:', err);
      return res.status(500).json({ message: 'Erro interno ao criar token de recuperação.' });
    }
  };

  export const validateToken = (req: Request, res: Response) => {
    const { token } = req.params;
  
    try {
      jwt.verify(token, process.env.JWT_SECRET!);
      return res.status(200).json({ valid: true });
    } catch (error) {
      return res.status(400).json({ valid: false, message: "Token inválido ou expirado." });
    }
  };


  export const resetPassword = async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { email: string };
      const user = await User.findOne({ email: decoded.email });
  
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado." });
      }

      if(!user.resetTokenExpires || user.resetTokenExpires < new Date()) {
        return res.status(400).json({ message: 'Token expirado.' });
      }

      user.senha = newPassword;
      user.resetToken = undefined;
      user.resetTokenExpires = undefined;
      await user.save();
  
      res.json({ message: "Senha atualizada com sucesso." });
    } catch (error) {
      res.status(400).json({ message: "Token inválido ou expirado." });
    }
  };