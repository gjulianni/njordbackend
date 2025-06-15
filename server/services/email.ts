const SibApiV3Sdk = require('sib-api-v3-sdk');
import dotenv from 'dotenv';
dotenv.config();

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY as string;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

export const sendRecoveryEmail = async (email: string, token: string) => {
  try {
    const resetUrl = `${process.env.REACT_APP_FRONTEND_URL}/recover/${token}`; 

    const sendSmtpEmail = {
      to: [{ email }], // aqui vai o e-mail do usuário dinamicamente
      sender: { name: 'NJORD', email: process.env.BREVO_VERIFIED_EMAIL! },
      subject: 'Recuperação de Senha',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <div style="text-align: center;">
            <img src="https://i.imgur.com/wpTjqAa.png" alt="Njord" style="max-width: 150px; margin-bottom: 20px;" />
          </div>
          <h2 style="text-align: center; color: #333;">Recuperação de Senha</h2>
          <p>Olá, você solicitou a recuperação de senha da sua conta.</p>
          <p>Clique no link abaixo para redefinir sua senha:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetUrl}" style="background-color: #007bff; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Redefinir Senha</a>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <p style="color: red;">ATENÇÃO: Por questões de segurança, o token para recuperação de senha expira em 15 minutos.</p>
          </div>
          <p>Se você não solicitou isso, ignore este e-mail.</p>
        </div>
      `,
    };

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    return response;
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    throw new Error('Erro ao enviar e-mail de recuperação');
  }
};