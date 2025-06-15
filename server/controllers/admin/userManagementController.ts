import { Request, Response } from 'express';
import User from '../../models/user';
import { Role } from '../../models/enums/role';
import { isValidObjectId } from 'mongoose';
import dotenv from 'dotenv';
import { AuthenticatedRequest } from '../../middlewares/verifyToken';
import mongoose from 'mongoose';

dotenv.config();

export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.body;
  
      if (!id || !isValidObjectId(id)) {
        return res.status(400).json({ message: 'ID inválido.' });
      }
  
      const userId = new mongoose.Types.ObjectId(id);
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }
  
      const deletedUser = await User.findByIdAndDelete(userId);
  
      return res.status(200).json({ message: 'Usuário deletado com sucesso.', deletedUser });
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      return res.status(500).json({ message: 'Erro interno ao deletar usuário.' });
    }
  };

  export const updateUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id, nome, email, role } = req.body;
    
        if (!id || !isValidObjectId(id)) {
          return res.status(400).json({ message: 'ID inválido.' });
        }
    
        const userId = new mongoose.Types.ObjectId(id);
    
        const user = await User.findById(userId);

        if (!user) {
          return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        const updateData: { nome?: string, email?: string, role?: string } = {};

        if (nome) updateData.nome = nome;
        if (email) updateData.email = email;
        if (role) updateData.role = role;

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true});
    
        return res.status(200).json({ message: 'Usuário atualizado com sucesso.', updatedUser });
      } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        return res.status(500).json({ message: 'Erro interno ao deletar usuário.' });
      }
  }