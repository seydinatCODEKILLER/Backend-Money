// routes/AlertRoutes.js
import express from "express";
import AlertController from "../controllers/AlertController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

export default class AlertRoutes {
  constructor() {
    this.router = express.Router();
    this.controller = new AlertController();
    this.authMiddleware = new AuthMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {
    /**
     * @swagger
     * /api/alerts:
     *   get:
     *     summary: Liste des alertes de l'utilisateur
     *     tags: [Alerts]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/pageQuery'
     *       - $ref: '#/components/parameters/pageSizeQuery'
     *       - in: query
     *         name: isRead
     *         schema:
     *           type: boolean
     *         description: Filtrer par statut de lecture
     *       - in: query
     *         name: type
     *         schema:
     *           type: string
     *           enum: [BUDGET_DEPASSE, SEUIL_ATTEINT, DEPENSE_IMPORTANTE]
     *         description: Filtrer par type d'alerte
     *       - in: query
     *         name: sourceType
     *         schema:
     *           type: string
     *           enum: [GLOBAL, CATEGORY, TRANSACTION]
     *         description: Filtrer par source
     *     responses:
     *       200:
     *         description: Liste des alertes récupérée
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
     *                         alerts:
     *                           type: array
     *                           items:
     *                             $ref: '#/components/schemas/Alert'
     *                         pagination:
     *                           type: object
     *                         filters:
     *                           type: object
     *       401:
     *         description: Non authentifié
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.get("/", this.authMiddleware.protect(), (req, res) =>
      this.controller.getAlerts(req, res)
    );

    /**
     * @swagger
     * /api/alerts/stats:
     *   get:
     *     summary: Statistiques des alertes
     *     tags: [Alerts]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Statistiques des alertes récupérées
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
     *                         total:
     *                           type: integer
     *                         unread:
     *                           type: integer
     *                         byType:
     *                           type: object
     *       401:
     *         description: Non authentifié
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.get("/stats", this.authMiddleware.protect(), (req, res) =>
      this.controller.getAlertStats(req, res)
    );

    /**
     * @swagger
     * /api/alerts/{id}/read:
     *   put:
     *     summary: Marquer une alerte comme lue
     *     tags: [Alerts]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: ID de l'alerte
     *     responses:
     *       200:
     *         description: Alerte marquée comme lue
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/Success'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/Alert'
     *       401:
     *         description: Non authentifié
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       404:
     *         description: Alerte non trouvée
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.put("/:id/read", this.authMiddleware.protect(), (req, res) =>
      this.controller.markAsRead(req, res)
    );

    /**
     * @swagger
     * /api/alerts:
     *   post:
     *     summary: Créer une alerte manuelle
     *     tags: [Alerts]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - type
     *               - message
     *             properties:
     *               type:
     *                 type: string
     *                 enum: [BUDGET_DEPASSE, SEUIL_ATTEINT, DEPENSE_IMPORTANTE]
     *                 example: DEPENSE_IMPORTANTE
     *               sourceType:
     *                 type: string
     *                 enum: [GLOBAL, CATEGORY, TRANSACTION]
     *                 default: GLOBAL
     *               categoryId:
     *                 type: string
     *                 description: ID de la catégorie (optionnel)
     *               message:
     *                 type: string
     *                 example: "Alerte manuelle importante"
     *               amount:
     *                 type: number
     *                 minimum: 0
     *               threshold:
     *                 type: number
     *                 minimum: 0
     *     responses:
     *       201:
     *         description: Alerte créée avec succès
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/Success'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/Alert'
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
    this.router.post("/", this.authMiddleware.protect(), (req, res) =>
      this.controller.createAlert(req, res)
    );

    /**
     * @swagger
     * /api/alerts/generate:
     *   post:
     *     summary: Générer des alertes automatiques (pour tests)
     *     tags: [Alerts]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Alertes automatiques générées
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
     *                         generated:
     *                           type: integer
     *                         alerts:
     *                           type: array
     *                           items:
     *                             $ref: '#/components/schemas/Alert'
     *       401:
     *         description: Non authentifié
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.post("/generate", this.authMiddleware.protect(), (req, res) =>
      this.controller.generateAlerts(req, res)
    );
  }

  get routes() {
    return this.router;
  }
}
