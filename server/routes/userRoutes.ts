import {Router} from 'express';
import { register, login, logout, getUserInfo, updateUserInfo, enable2FA, verify2FA, verifyLoginCode, verifyBackupCode } from '../controllers/userController';
import { authenticate } from '../middlewares/verifyToken';
import { authorizeAdmin } from '../middlewares/authorizeAdmin';

const userRouter = Router();

userRouter.post("/register", register);
userRouter.post("/login", login);
userRouter.post("/logout", logout);
userRouter.get("/info", authenticate, getUserInfo);
userRouter.put("/update", authenticate, updateUserInfo);

// Rotas referente à funcionalidade de autenticaçao dois fatores
userRouter.post("/enable-2fa", authenticate, enable2FA);
userRouter.post("/verify-2fa", authenticate, verify2FA);
userRouter.post("/verify-login-code", verifyLoginCode);
userRouter.post("/verify-backup-code", verifyBackupCode);

// Rota usada pelo contexto de autenticaçao para validar a sessão do usuario
userRouter.get('/verify', authenticate, (req, res) => {
    res.status(200).json({ authenticated: true });
  });

userRouter.get('/admin', authenticate, authorizeAdmin, (req, res) => {
  res.json({ message: 'Acesso administrativo autorizado.'})
})

export default userRouter;