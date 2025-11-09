import express from "express";
import ChatController from "../controllers/ChatController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import { requireAIPrivilege } from "../middlewares/limitAIUsage.js";

export default class ChatRoutes {
  constructor() {
    this.router = express.Router();
    this.controller = new ChatController();
    this.authMiddleware = new AuthMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {
    /**
     * @swagger
     * /api/chat/messages:
     *   post:
     *     summary: Envoyer un message au chatbot
     *     tags: [Chat]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - content
     *             properties:
     *               content:
     *                 type: string
     *                 example: "Comment puis-je réduire mes dépenses alimentaires ?"
     *     responses:
     *       200:
     *         description: Message envoyé et réponse reçue
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/Success'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       type: object
     *                       properties:
     *                         userMessage:
     *                           $ref: '#/components/schemas/ChatMessage'
     *                         assistantMessage:
     *                           $ref: '#/components/schemas/ChatMessage'
     *       400:
     *         description: Message vide
     *       401:
     *         description: Non authentifié
     */
    this.router.post("/messages", this.authMiddleware.protect(),requireAIPrivilege, (req, res) =>
      this.controller.sendMessage(req, res)
    );

    /**
     * @swagger
     * /api/chat/messages:
     *   get:
     *     summary: Récupérer l'historique des conversations
     *     tags: [Chat]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/pageQuery'
     *       - $ref: '#/components/parameters/pageSizeQuery'
     *     responses:
     *       200:
     *         description: Historique récupéré avec succès
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/Success'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       type: object
     *                       properties:
     *                         messages:
     *                           type: array
     *                           items:
     *                             $ref: '#/components/schemas/ChatMessage'
     *                         pagination:
     *                           type: object
     *       401:
     *         description: Non authentifié
     */
    this.router.get(
      "/messages",
      this.authMiddleware.protect(),
      requireAIPrivilege,
      (req, res) => this.controller.getChatHistory(req, res)
    );

    /**
     * @swagger
     * /api/chat/messages:
     *   delete:
     *     summary: Effacer l'historique des conversations
     *     tags: [Chat]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Historique effacé avec succès
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/Success'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       type: object
     *                       properties:
     *                         deletedCount:
     *                           type: integer
     *       401:
     *         description: Non authentifié
     */
    this.router.delete(
      "/messages",
      this.authMiddleware.protect(),
      requireAIPrivilege,
      (req, res) => this.controller.clearChatHistory(req, res)
    );
  }

  get routes() {
    return this.router;
  }
}
