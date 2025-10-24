import nodemailer from "nodemailer";
import { env } from "../config/env.js";

export default class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  async sendPasswordResetEmail(email, resetToken) {
    try {
      const resetLink = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: env.EMAIL_FROM,
        to: email,
        subject: "Réinitialisation de votre mot de passe - MoneyWise",
        html: this.getPasswordResetTemplate(resetLink),
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log(`✅ Email de réinitialisation envoyé à: ${email}`);
      console.log(`🔗 Lien: ${resetLink}`);
      console.log(`📨 Message ID: ${info.messageId}`);

      return true;
    } catch (error) {
      console.error("❌ Erreur lors de l'envoi de l'email:", error);
      throw new Error("Erreur lors de l'envoi de l'email de réinitialisation");
    }
  }

  async sendWelcomeEmail(email, userName) {
    try {
      const mailOptions = {
        from: env.EMAIL_FROM,
        to: email,
        subject: "Bienvenue sur MoneyWise !",
        html: this.getWelcomeTemplate(userName),
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log(`✅ Email de bienvenue envoyé à: ${email}`);
      console.log(`📨 Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'envoi de l'email de bienvenue:",
        error
      );
      return false;
    }
  }

  async sendPasswordChangedEmail(email, userName) {
    try {
      const mailOptions = {
        from: env.EMAIL_FROM,
        to: email,
        subject: "Votre mot de passe a été modifié - MoneyWise",
        html: this.getPasswordChangedTemplate(userName),
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log(
        `✅ Email de confirmation de changement de mot de passe envoyé à: ${email}`
      );
      console.log(`📨 Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'envoi de l'email de confirmation:",
        error
      );
      return false;
    }
  }

  // Test de connexion SMTP
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log("✅ Connexion SMTP établie avec succès");
      return true;
    } catch (error) {
      console.error("❌ Erreur de connexion SMTP:", error);
      return false;
    }
  }

  getPasswordResetTemplate(resetLink) {
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Réinitialisation de mot de passe</title>
          <style>
              body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
              .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>MoneyWise</h1>
              <h2>Réinitialisation de mot de passe</h2>
          </div>
          <div class="content">
              <p>Bonjour,</p>
              <p>Vous avez demandé la réinitialisation de votre mot de passe MoneyWise.</p>
              <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
              
              <div style="text-align: center;">
                  <a href="${resetLink}" class="button">Réinitialiser mon mot de passe</a>
              </div>

              <div class="warning">
                  <strong>⚠️ Important :</strong>
                  <p>Ce lien expirera dans 1 heure pour des raisons de sécurité.</p>
                  <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
              </div>

              <p>Si le bouton ne fonctionne pas, copiez et collez le lien suivant dans votre navigateur :</p>
              <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${resetLink}</p>
          </div>
          <div class="footer">
              <p>© ${new Date().getFullYear()} MoneyWise. Tous droits réservés.</p>
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
      </body>
      </html>
    `;
  }

  getWelcomeTemplate(userName) {
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bienvenue sur MoneyWise</title>
          <style>
              body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #4CAF50; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>🎉 Bienvenue sur MoneyWise !</h1>
          </div>
          <div class="content">
              <p>Bonjour <strong>${userName}</strong>,</p>
              <p>Félicitations ! Votre compte MoneyWise a été créé avec succès.</p>
              
              <p>Découvrez dès maintenant toutes les fonctionnalités pour gérer vos finances :</p>
              
              <div class="feature">
                  <strong>📊 Suivi des dépenses</strong>
                  <p>Suivez vos revenus et dépenses en temps réel</p>
              </div>
              
              <div class="feature">
                  <strong>📈 Budgets personnalisés</strong>
                  <p>Créez des budgets par catégorie et respectez vos objectifs</p>
              </div>
              
              <div class="feature">
                  <strong>🔔 Alertes intelligentes</strong>
                  <p>Recevez des notifications quand vous dépassez vos budgets</p>
              </div>
              
              <p>Commencez dès maintenant à prendre le contrôle de vos finances !</p>
              
              <div style="text-align: center; margin: 30px 0;">
                  <a href="${
                    env.FRONTEND_URL
                  }" style="background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                      Commencer à utiliser MoneyWise
                  </a>
              </div>
          </div>
          <div class="footer">
              <p>© ${new Date().getFullYear()} MoneyWise. Tous droits réservés.</p>
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
      </body>
      </html>
    `;
  }

  getPasswordChangedTemplate(userName) {
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Mot de passe modifié</title>
          <style>
              body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .warning { background: #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>🔒 Mot de passe modifié</h1>
          </div>
          <div class="content">
              <p>Bonjour <strong>${userName}</strong>,</p>
              <p>Votre mot de passe MoneyWise a été modifié avec succès.</p>
              
              <div class="warning">
                  <strong>⚠️ Sécurité :</strong>
                  <p>Si vous n'êtes pas à l'origine de cette modification, veuillez immédiatement :</p>
                  <ol>
                      <li>Utiliser la fonction "Mot de passe oublié" pour réinitialiser votre mot de passe</li>
                      <li>Nous contacter à support@moneywise.com</li>
                      <li>Vérifier l'activité récente de votre compte</li>
                  </ol>
              </div>
              
              <p>Date de la modification : <strong>${new Date().toLocaleString(
                "fr-FR"
              )}</strong></p>
          </div>
          <div class="footer">
              <p>© ${new Date().getFullYear()} MoneyWise. Tous droits réservés.</p>
              <p>Cet email a été envoyé automatiquement pour votre sécurité.</p>
          </div>
      </body>
      </html>
    `;
  }
}
