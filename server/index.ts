import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import express, {Request, Response} from 'express';
import chalk from 'chalk';
import cookieParser from 'cookie-parser';
import { pool } from './databases/mysql/estfrn02';
// Rotas
import userRouter from './routes/userRoutes';
import recoverRouter from './routes/recoverPasswordRouter';
import csvRouter from './routes/csvRoutes';
import adminRouter from './routes/admin/adminManagementRoutes';

// Modelos
import User from './models/user';
import { pool_estfrn01 } from './databases/mysql/estfrn01';
import comparisonRouter from './routes/comparisonRoutes';



const app = express();

// ===================== MIDDLEWARES =====================
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3030', // Frontend
  credentials: true
}));

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(cookieParser());

// ===================== ROTAS =====================
app.use("/api/user", userRouter);          // Autenticação
app.use("/api/recover", recoverRouter);    // Recuperação de senha
app.use("/api/csv", csvRouter);            // Upload de CSV
app.use("/api/compare", comparisonRouter); // Comparação de valores

app.use("/api/admin", adminRouter);       // Rotas para admin

// Rota para não encontradas
app.use((req: Request, res: Response): Response => {
  return res.status(404).json({
    message: "Rota não encontrada",
  });
});

// ===================== CONEXÕES =====================

async function startServer() {
  
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
  const MONGODB_URL = process.env.MONGODB_URL;

  if (!MONGODB_URL) throw new Error('A variável MONGODB_URL não está definida.');
  if (!pool) throw new Error('Pool do MySQL não está configurado.');

  try {
    // Testa conexão com MySQL
    await pool.query('SELECT 1');
    console.log(chalk.green('✅ Conectado ao MySQL - estfrn02 com sucesso'));

    //Conecta à estação estfrn01
    await pool_estfrn01.query('SELECT 1');
    console.log(chalk.green('✅ Conectado ao MySQL - estfrn01 com sucesso'));

    // Conecta ao MongoDB
    await mongoose.connect(MONGODB_URL);
    console.log(chalk.green('✅ Conectado ao MongoDB com sucesso'));

    // Inicia servidor
    app.listen(PORT, "0.0.0.0", () => {
      console.log(chalk.blue(`🚀 Servidor rodando na porta ${PORT}`));
    });

  } catch (error) {
    console.error(chalk.red('❌ Erro ao iniciar servidor:'), error);
    process.exit(1); // Encerra o processo em caso de erro crítico
  }
}

startServer();