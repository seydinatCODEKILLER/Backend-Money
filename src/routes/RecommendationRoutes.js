// routes/RecommendationRoutes.js
import express from "express";
import RecommendationController from "../controllers/RecommendationController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import { allowOnlyOneUserForAI } from "../middlewares/limitAIUsage.js";

export default class RecommendationRoutes {
  constructor() {
    this.router = express.Router();
    this.controller = new RecommendationController();
    this.authMiddleware = new AuthMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {
    /**
     * @swagger
     * /api/recommendations:
     *   get:
     *     summary: Liste des recommandations financières
     *     tags: [Recommendations]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/pageQuery'
     *       - $ref: '#/components/parameters/pageSizeQuery'
     *       - in: query
     *         name: type
     *         schema:
     *           type: string
     *           enum: [BUDGET_ALERT, SPENDING_PATTERN, SAVING_OPPORTUNITY, DEBT_REDUCTION, INVESTMENT_SUGGESTION, CATEGORY_OPTIMIZATION, SUBSCRIPTION_REVIEW, INCOME_OPTIMIZATION, GOAL_PROGRESSION, SYSTEM_SUGGESTION]
     *         description: Filtrer par type de recommandation
     *     responses:
     *       200:
     *         description: Liste des recommandations récupérée
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
     *                         recommendations:
     *                           type: array
     *                           items:
     *                             $ref: '#/components/schemas/Recommendation'
     *                         pagination:
     *                           type: object
     *       401:
     *         description: Non authentifié
     */
    this.router.get("/", this.authMiddleware.protect(),allowOnlyOneUserForAI, (req, res) =>
      this.controller.getRecommendations(req, res)
    );

    /**
     * @swagger
     * /api/recommendations/generate:
     *   post:
     *     summary: Générer de nouvelles recommandations automatiques
     *     tags: [Recommendations]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Recommandations générées avec succès
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
     *                         recommendations:
     *                           type: array
     *                           items:
     *                             $ref: '#/components/schemas/Recommendation'
     *       401:
     *         description: Non authentifié
     */
    this.router.post("/generate", this.authMiddleware.protect(),allowOnlyOneUserForAI, (req, res) =>
      this.controller.generateRecommendations(req, res)
    );

    /**
     * @swagger
     * /api/recommendations/{id}:
     *   delete:
     *     summary: Supprimer une recommandation
     *     tags: [Recommendations]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: ID de la recommandation
     *     responses:
     *       200:
     *         description: Recommandation supprimée avec succès
     *       401:
     *         description: Non authentifié
     *       404:
     *         description: Recommandation non trouvée
     */
    this.router.delete("/:id", this.authMiddleware.protect(),allowOnlyOneUserForAI, (req, res) =>
      this.controller.deleteRecommendation(req, res)
    );
  }

  get routes() {
    return this.router;
  }
}
