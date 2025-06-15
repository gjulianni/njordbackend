import { Router } from 'express';
import { createRecoverToken, resetPassword, validateToken } from '../controllers/recoverPasswordController';

const recoverRouter = Router();

recoverRouter.post("/", createRecoverToken); // rota para criar o token necessario para recuperaçao (esta funcionalidade ativa após colocar api/recover apenas)
recoverRouter.get("/validate/:token", validateToken) // rota para validar o token que está sendo usado para recuperar a senha
recoverRouter.post("/reset", resetPassword); // rota para redefinir a senha de fato no banco de dados

export default recoverRouter;