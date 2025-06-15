import { Request, Response } from 'express';
import User from '../models/user';
import { Role } from '../models/enums/role';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { AuthenticatedRequest } from '../middlewares/verifyToken';
import mongoose from 'mongoose';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import crypto from 'crypto';

dotenv.config();



export const register = async (req: Request, res: Response) => {
    const { nome, email, senha } = req.body;

    try {
        // Verificando se todos os parâmetros necessarios para registro foram passados pelo body
        if(!nome || !email || !senha) {
            return res.status(400).json({ 
            message: 'Todos credenciais são obrigatórios.'})
        }

          let passwordLengthMatch: boolean = false;
          let value: number = 0;

          let upperCaseRegex = /[A-Z]/.test(senha);
          let numberRegex = /[0-9]/.test(senha);
          let lowerCaseRegex = /[a-z]/.test(senha);
          let specialCharacterRegex = /[!@#$%^&*(),.?":{}|<>]/.test(senha);

          if (upperCaseRegex) value += 20;
          if (lowerCaseRegex) value += 20;
          if (numberRegex) value += 20;
          if (specialCharacterRegex) value += 20;
          if (senha.length >= 8) value += 20;

          if (senha.length >= 8) {
            passwordLengthMatch = true;
          }

          if(!passwordLengthMatch) {
            return res.status(400).json({ message: 'A senha não possui o mínimo de caracteres esperados.'});
          }

          if(value < 60) {
            return res.status(400).json({ message: 'A senha não possui os requisitos necessários para validação.'})
          }
      
        // Verificando se o mail inserido pelo usuario já está cadastrado
        const usuarioExistente = await User.findOne({ email });
        if(usuarioExistente) {
            return res.status(400).json({ message: 'Email já registrado' });
        }

        const novoUsuario = new User({
            nome,
            email,
            senha, 
            role: Role.user,
          });
          // Insere o usuario recem criado ao banco
        await novoUsuario.save();
        return res.status(201).json({ message: 'Usuário criado com sucesso' });
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao criar usuário', err });
  }
}


export const login = async (req: Request, res: Response): Promise<Response> => {
    
    const { email, senha, token2FA } = req.body;

    try {
        if(!email || !senha) {
            return res.status(404).json({ message: 'Credenciais email e senha são necessárias' });
        }

        const usuarioExiste = await User.findOne({ email });
        if(!usuarioExiste) {
            return res.status(400).json({ message: 'Não foi possível encontrar este usuário.' });
        }

        const senhaValida = await usuarioExiste.compararSenhas(senha);
        if(!senhaValida) {
            return res.status(400).json({ message: 'Senha incorreta.' })
        }

        if(usuarioExiste.is2FAEnabled) {
          if(!token2FA) {
            const tempToken = jwt.sign(
              { _id: usuarioExiste._id },
              process.env.JWT_TEMP_SECRET!, // chave temporaria separada
              { expiresIn: '10m' }
            );
      
            return res.status(206).json({
              message: 'Código 2FA necessário.',
              requires2FA: true,
              tempToken,
            });
          }

          if (!usuarioExiste.twoFASecret) {
            return res.status(400).json({ message: '2FA não configurado corretamente.' });
          }

          const validToken = speakeasy.totp.verify({
            secret: usuarioExiste.twoFASecret,
            encoding: 'base32',
            token: token2FA,
            window: 1,
          });

          if(!validToken) {
            return res.status(401).json({ message: 'Código 2FA inválido.' });
          }
        }

        const token = jwt.sign({ _id: usuarioExiste._id, role: usuarioExiste.role}, process.env.JWT_SECRET!, { expiresIn: '1h'});
        res.cookie('auth_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production', // HTTPS em produção
          sameSite: 'lax',
          maxAge: 3600000, // 1 hora
        });

        return res.status(200).json({ message: 'Login bem-sucedido', token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao tentar fazer login.' });
  }
}


export const logout = async (req: Request, res: Response) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'lax',
  });

  res.status(200).json({ message: 'Logout bem-sucedido' })
}


export const getUserInfo = async (req: AuthenticatedRequest, res: Response) => {

  try {

    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const userId = new mongoose.Types.ObjectId(req.user._id); 
    const user = await User.findById(userId).select('-twoFASecret');

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }


    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao atualizar usuário', error });
  }
};


export const updateUserInfo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user ? req.user._id : '');


    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const { nome, email, senha } = req.body;

   
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const updateData: { nome?: string, email?: string, senha?: string } = {};

    if (nome) updateData.nome = nome;
    if (email) updateData.email = email;
    if (senha) {
      const hashedPassword = await bcrypt.hash(senha, 10);
      updateData.senha = hashedPassword;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

    return res.status(200).json(updatedUser);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao atualizar usuário', error });
  }
};

export const enable2FA = async (req: AuthenticatedRequest, res: Response) => {
  try {

  function generateBackupCode(length = 8) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(length);
  let result = '';

  for (let i = 0; i < length; i++) {
    result += characters[bytes[i] % characters.length];
  }

  return result;
}
    const userId = new mongoose.Types.ObjectId(req.user ? req.user._id : '');

    if(!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado.'})
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const secret = speakeasy.generateSecret({ 
    name: `Njord (${user.email})`, 
    length: 20, 
    issuer: 'Njord' 
  });

  if (!secret.otpauth_url) {
    return res.status(500).json({ message: 'Erro ao gerar URL do QR Code' });
  }

    const backupCode = generateBackupCode();

    user.twoFASecret = secret.base32;
    user.backupCode = backupCode;
    await user.save();
    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);

    return res.status(200).json({
      qrCode: qrCodeDataUrl,
      secret: secret.base32, 
    });
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao ativar 2FA', err });
  }
};

export const verify2FA = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user ? req.user._id : '');
    const { token } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    const user = await User.findById(userId);
    if (!user || !user.twoFASecret) {
      return res.status(400).json({ message: 'Usuário não configurou o 2FA.' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: 'base32',
      token,
      window: 1, // tolerancia de tempo (pode aceitar o codigo anterior/proximo)
    });

    if (!verified) {
      return res.status(401).json({ message: 'Token inválido.' });
    }
    user.is2FAEnabled = true;
    await user.save();
    return res.status(200).json({ message: '2FA verificado com sucesso!' });
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao verificar 2FA', err });
  }
};

export const verifyLoginCode = async (req: AuthenticatedRequest, res: Response) => {
  const { token2FA, tempToken } = req.body;

  try {

    const decodedTempToken = jwt.verify(tempToken, process.env.JWT_TEMP_SECRET!) as { _id: string };

    if (!decodedTempToken) {
      return res.status(401).json({ message: 'Token temporário inválido ou expirado.' });
    }

    const userId = decodedTempToken._id;
    const user = await User.findById(userId);

    if (!user || !user.twoFASecret) {
      return res.status(400).json({ message: 'Usuário não configurou o 2FA.' });
    }

    const validToken = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: 'base32',
      token: token2FA,
      window: 1,
    });

    if (!validToken) {
      return res.status(401).json({ message: 'Código 2FA inválido.' });
    }
    const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '1h' });

   
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600000, 
    });

    return res.status(200).json({ message: 'Login bem-sucedido', token });
  } catch (err) {
    console.error("Erro ao verificar código 2FA:", err);
    return res.status(500).json({ message: 'Erro ao verificar 2FA', err });
  }
}

export const verifyBackupCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { backupCode } = req.body;

    const validCode = await User.findOne({ backupCode: backupCode }, 
    { _id: 1, role: 1 });


    if(!validCode) {
      return res.status(404).json({message: 'Não foi possível encontrar este código de backup'});
    }
    const token = jwt.sign({_id: validCode._id, role: validCode.role}, process.env.JWT_SECRET!, {expiresIn: '1h'});
    res.cookie('auth_token', token, {
       httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600000, 
    });

    validCode.backupCode = undefined;
    validCode.is2FAEnabled = false;
    validCode.twoFASecret = undefined;
    await validCode.save();

    return res.status(200).json({ message: 'Login bem-sucedido', token, fromBackupVerify: true });
  } catch (err) {
    console.error("Erro ao verificar backup code:", err);
    return res.status(500).json({ message: 'Erro ao verificar backup code', err });
  }
}