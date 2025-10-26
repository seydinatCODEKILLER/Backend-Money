// routes/DashboardRoutes.js
import express from "express";
import DashboardController from "../controllers/DashboardController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

export default class DashboardRoutes {
  constructor() {
    this.router = express.Router();
    this.controller = new DashboardController();
    this.auth = new AuthMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {
    /**
     * @swagger
     * /api/dashboard/overview:
     *   get:
     *     summary: Vue d'ensemble du dashboard
     *     tags: [Dashboard]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/periodQuery'
     *     responses:
     *       200:
     *         description: Données du dashboard récupérées avec succès
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/Success'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/DashboardOverview'
     *       401:
     *         description: Non authentifié
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.get("/overview", this.auth.protect(), (req, res) =>
      this.controller.getOverview(req, res)
    );

    /**
     * @swagger
     * /api/dashboard/expenses-by-category:
     *   get:
     *     summary: Dépenses par catégorie (pour camembert)
     *     tags: [Dashboard]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/periodQuery'
     *     responses:
     *       200:
     *         description: Dépenses par catégorie récupérées
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
     *                         data:
     *                           type: array
     *                           items:
     *                             type: object
     *                             properties:
     *                               id:
     *                                 type: string
     *                               name:
     *                                 type: string
     *                               value:
     *                                 type: number
     *                               count:
     *                                 type: integer
     *                               color:
     *                                 type: string
     *                               icon:
     *                                 type: string
     *                               percentage:
     *                                 type: integer
     *                         total:
     *                           type: number
     *                         period:
     *                           type: string
     *       401:
     *         description: Non authentifié
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.get("/expenses-by-category", this.auth.protect(), (req, res) =>
      this.controller.getExpensesByCategory(req, res)
    );

    /**
     * @swagger
     * /api/dashboard/monthly-trends:
     *   get:
     *     summary: Tendances mensuelles (revenus vs dépenses)
     *     tags: [Dashboard]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/monthsQuery'
     *     responses:
     *       200:
     *         description: Tendances mensuelles récupérées
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
     *                         data:
     *                           type: object
     *                           properties:
     *                             labels:
     *                               type: array
     *                               items:
     *                                 type: string
     *                             datasets:
     *                               type: array
     *                               items:
     *                                 type: object
     *                         summary:
     *                           type: object
     *                         period:
     *                           type: string
     *       401:
     *         description: Non authentifié
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.get("/monthly-trends", this.auth.protect(), (req, res) =>
      this.controller.getMonthlyTrends(req, res)
    );

    /**
     * @swagger
     * /api/dashboard/global-budget:
     *   get:
     *     summary: État du budget global
     *     tags: [Dashboard]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - $ref: '#/components/parameters/periodQuery'
     *     responses:
     *       200:
     *         description: État du budget global récupéré
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
     *                         totalBudget:
     *                           type: number
     *                         totalSpent:
     *                           type: number
     *                         remaining:
     *                           type: number
     *                         percentageUsed:
     *                           type: number
     *                         categories:
     *                           type: array
     *                           items:
     *                             type: object
     *       401:
     *         description: Non authentifié
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.get("/global-budget", this.auth.protect(), (req, res) =>
      this.controller.getGlobalBudget(req, res)
    );
  }

  get routes() {
    return this.router;
  }
}
