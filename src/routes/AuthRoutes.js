import express from "express";
import AuthController from "../controllers/AuthController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import upload from "../config/multer.js";

export default class AuthRoutes {
  constructor() {
    this.router = express.Router();
    this.controller = new AuthController();
    this.authMiddleware = new AuthMiddleware();

    this.setupRoutes();
  }

  setupRoutes() {
    /**
     * @swagger
     * /api/auth/register:
     *   post:
     *     summary: Inscription d'un nouvel utilisateur
     *     tags: [Authentication]
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             required:
     *               - nom
     *               - prenom
     *               - email
     *               - password
     *             properties:
     *               nom:
     *                 type: string
     *                 example: Dupont
     *                 minLength: 2
     *               prenom:
     *                 type: string
     *                 example: Jean
     *                 minLength: 2
     *               email:
     *                 type: string
     *                 format: email
     *                 example: jean.dupont@email.com
     *               password:
     *                 type: string
     *                 format: password
     *                 minLength: 8
     *                 example: MonMotDePasse123!
     *               avatar:
     *                 type: string
     *                 format: binary
     *                 description: Image d'avatar (optionnelle, max 5MB)
     *     responses:
     *       201:
     *         description: Utilisateur créé avec succès
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/Success'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/AuthResponse'
     *       400:
     *         description: Données invalides ou mot de passe faible
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       409:
     *         description: Email déjà utilisé
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.post("/register", upload.single('avatar'), (req, res) => this.controller.register(req, res));

    /**
     * @swagger
     * /api/auth/login:
     *   post:
     *     summary: Connexion d'un utilisateur
     *     tags: [Authentication]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *               - password
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *                 example: jean.dupont@email.com
     *               password:
     *                 type: string
     *                 format: password
     *                 example: MonMotDePasse123!
     *     responses:
     *       200:
     *         description: Connexion réussie
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/Success'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/AuthResponse'
     *       401:
     *         description: Identifiants invalides
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       403:
     *         description: Compte suspendu ou désactivé
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.post("/login", (req, res) => this.controller.login(req, res));

    /**
     * @swagger
     * /api/auth/forgot-password:
     *   post:
     *     summary: Demande de réinitialisation de mot de passe
     *     tags: [Authentication]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *                 example: jean.dupont@email.com
     *     responses:
     *       200:
     *         description: Email envoyé si l'adresse existe
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Success'
     *       400:
     *         description: Email invalide
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.post("/forgot-password", (req, res) => this.controller.forgotPassword(req, res));

    /**
     * @swagger
     * /api/auth/reset-password:
     *   post:
     *     summary: Réinitialisation du mot de passe
     *     tags: [Authentication]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - token
     *               - newPassword
     *             properties:
     *               token:
     *                 type: string
     *                 example: "12345678-1234-1234-1234-123456789abc"
     *               newPassword:
     *                 type: string
     *                 format: password
     *                 minLength: 8
     *                 example: "NouveauMotDePasse123!"
     *     responses:
     *       200:
     *         description: Mot de passe réinitialisé avec succès
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Success'
     *       400:
     *         description: Token invalide ou expiré
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.post("/reset-password", (req, res) => this.controller.resetPassword(req, res));

    /**
     * @swagger
     * /api/auth/me:
     *   get:
     *     summary: Récupérer les informations de l'utilisateur connecté
     *     tags: [Authentication]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Informations utilisateur récupérées
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/Success'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/User'
     *       401:
     *         description: Non authentifié
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.get("/me", this.authMiddleware.protect(), (req, res) => this.controller.getCurrentUser(req, res));

    /**
     * @swagger
     * /api/auth/profile:
     *   put:
     *     summary: Mettre à jour le profil utilisateur
     *     tags: [Authentication]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               nom:
     *                 type: string
     *                 example: Dupont
     *                 minLength: 2
     *               prenom:
     *                 type: string
     *                 example: Jean
     *                 minLength: 2
     *               avatar:
     *                 type: string
     *                 format: binary
     *                 description: Nouvelle image d'avatar (optionnelle, max 5MB)
     *     responses:
     *       200:
     *         description: Profil mis à jour avec succès
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/Success'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/User'
     *       400:
     *         description: Données invalides
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       401:
     *         description: Non authentifié
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.put("/profile", this.authMiddleware.protect(), upload.single('avatar'), (req, res) => this.controller.updateProfile(req, res));
  }

  get routes() {
    return this.router;
  }
}