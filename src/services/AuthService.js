// services/AuthService.js
import { v4 as uuidv4 } from "uuid";
import PasswordHasher from "../utils/hash.js";
import TokenGenerator from "../config/jwt.js";
import MediaUploader from "../utils/uploadMedia.js";
import { prisma } from "../config/database.js";
import EmailService from "../utils/EmailService.js";

export default class AuthService {
  constructor() {
    this.passwordHasher = new PasswordHasher();
    this.tokenGenerator = new TokenGenerator();
    this.mediaUploader = new MediaUploader();
    this.emailService = new EmailService();
  }

  async register(userData) {
    const { nom, prenom, email, password, avatarFile } = userData;

    // Vérification si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("Un utilisateur avec cet email existe déjà");
    }

    let avatarUrl = null;

    try {
      // Upload de l'avatar si fourni
      if (avatarFile) {
        avatarUrl = await this.mediaUploader.upload(
          avatarFile,
          "hackathon/avatars",
          `user_${prenom}_${nom}`.toLowerCase()
        );
      }

      // Hash du mot de passe
      const hashedPassword = await this.passwordHasher.hash(password);

      // Création de l'utilisateur
      const user = await prisma.user.create({
        data: {
          nom,
          prenom,
          email,
          password: hashedPassword,
          avatarUrl,
        },
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          role: true,
          avatarUrl: true,
          status: true,
          createdAt: true,
        },
      });

      // Génération du token JWT
      const token = this.tokenGenerator.sign({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      // Envoi de l'email de bienvenue (non bloquant)
      this.emailService
        .sendWelcomeEmail(email, `${prenom} ${nom}`)
        .catch((error) =>
          console.error("❌ Erreur email de bienvenue:", error)
        );

      return {
        user,
        token,
      };
    } catch (error) {
      // Rollback de l'upload si erreur
      if (avatarUrl) {
        await this.mediaUploader.rollback(
          `user_${prenom}_${nom}`.toLowerCase()
        );
      }
      throw error;
    }
  }

  async login(email, password) {
    // Recherche de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("Email ou mot de passe incorrect");
    }

    // Vérification du mot de passe
    const isPasswordValid = await this.passwordHasher.compare(
      password,
      user.password
    );
    if (!isPasswordValid) {
      throw new Error("Email ou mot de passe incorrect");
    }

    // Génération du token JWT
    const token = this.tokenGenerator.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Données utilisateur sans le mot de passe
    const userData = {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      status: user.status,
      createdAt: user.createdAt,
    };

    return {
      user: userData,
      token,
    };
  }

  async forgotPassword(email) {
    // Recherche de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Pour des raisons de sécurité, on ne révèle pas si l'email existe
    if (!user) {
      return {
        message: "Si l'email existe, un lien de réinitialisation a été envoyé",
      };
    }

    // Génération d'un token unique
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 heure

    // Création ou mise à jour du token de réinitialisation
    await prisma.passwordResetToken.upsert({
      where: { email },
      update: {
        token: resetToken,
        expiresAt,
        status: "PENDING",
        updatedAt: new Date(),
      },
      create: {
        email,
        token: resetToken,
        expiresAt,
        userId: user.id,
      },
    });

    // Envoi de l'email
    await this.emailService.sendPasswordResetEmail(email, resetToken);

    return {
      message: "Si l'email existe, un lien de réinitialisation a été envoyé",
    };
  }

  async resetPassword(token, newPassword) {
    // Recherche du token valide
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        status: "PENDING",
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!resetToken) {
      throw new Error("Token invalide ou expiré");
    }

    // Hash du nouveau mot de passe
    const hashedPassword = await this.passwordHasher.hash(newPassword);

    // Transaction pour garantir la cohérence des données
    const result = await prisma.$transaction(async (tx) => {
      // Mise à jour du mot de passe utilisateur
      const user = await tx.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true,
        },
      });

      // Marquer le token comme utilisé
      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { status: "USED" },
      });

      return user;
    });

    // Envoi de l'email de confirmation (non bloquant)
    this.emailService
      .sendPasswordChangedEmail(result.email, `${result.prenom} ${result.nom}`)
      .catch((error) =>
        console.error("❌ Erreur email de confirmation:", error)
      );

    return {
      message: "Mot de passe réinitialisé avec succès",
      user: result,
    };
  }

  async getCurrentUser(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    return user;
  }

  async updateProfile(userId, updateData) {
    const { nom, prenom, avatarFile } = updateData;

    let newAvatarInfo;

    try {
      // Récupérer l'ancien utilisateur
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("Utilisateur non trouvé");

      const oldAvatarUrl = user.avatarUrl;

      // Upload du nouvel avatar si fourni
      if (avatarFile) {
        const timestamp = Date.now();
        const prefix = `user_${userId}_${timestamp}`;
        const uploadedUrl = await this.mediaUploader.upload(
          avatarFile,
          "hackathon/avatars",
          prefix
        );

        newAvatarInfo = { url: uploadedUrl, prefix };
      }

      // Mise à jour du profil
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(nom && { nom }),
          ...(prenom && { prenom }),
          ...(newAvatarInfo && { avatarUrl: newAvatarInfo.url }),
        },
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          role: true,
          avatarUrl: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Supprimer l'ancien avatar si nouveau upload réussi
      if (newAvatarInfo && oldAvatarUrl) {
        await this.mediaUploader.deleteByUrl(oldAvatarUrl);
      }

      return updatedUser;
    } catch (error) {
      // Rollback si nouvel upload échoue
      if (newAvatarInfo) {
        await this.mediaUploader.rollback(newAvatarInfo.prefix);
      }
      throw error;
    }
  }
}
