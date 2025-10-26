// routes/reports.js
import express from "express";
import {
  getReports,
  generateReport,
  exportReport,
} from "../controllers/reportsController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import { generateReportData } from "../controllers/GenerateReport.js";

const router = express.Router();
const auth = new AuthMiddleware();

// Toutes les routes nécessitent une authentification
router.use(auth.protect());

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Récupérer la liste des rapports générés
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageQuery'
 *       - $ref: '#/components/parameters/pageSizeQuery'
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [MONTHLY, QUARTERLY, YEARLY, CUSTOM]
 *         description: Filtrer par type de rapport
 *     responses:
 *       200:
 *         description: Liste des rapports récupérée
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
 *                         reports:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Report'
 *                         pagination:
 *                           type: object
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", getReports);

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Générer un nouveau rapport
 *     tags: [Reports]
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
 *               - period
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Rapport mensuel Janvier 2024"
 *               type:
 *                 type: string
 *                 enum: [MONTHLY, QUARTERLY, YEARLY, CUSTOM]
 *                 example: MONTHLY
 *               period:
 *                 type: string
 *                 example: "2024-01"
 *               options:
 *                 type: object
 *                 properties:
 *                   includeCharts:
 *                     type: boolean
 *                     default: true
 *                   includeDetails:
 *                     type: boolean
 *                     default: true
 *     responses:
 *       201:
 *         description: Rapport généré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Report'
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
router.post("/", generateReport);

/**
 * @swagger
 * /api/reports/generate-data:
 *   post:
 *     summary: Générer des données de rapport (pour tests)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               period:
 *                 type: string
 *                 example: "2024-01"
 *               type:
 *                 type: string
 *                 enum: [MONTHLY, QUARTERLY, YEARLY]
 *                 example: MONTHLY
 *     responses:
 *       200:
 *         description: Données de rapport générées
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/generate-data", generateReportData);

/**
 * @swagger
 * /api/reports/export/{id}:
 *   get:
 *     summary: Exporter un rapport
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du rapport
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [pdf, excel, csv]
 *           default: pdf
 *         description: Format d'export
 *     responses:
 *       200:
 *         description: Rapport exporté avec succès
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           application/vnd.ms-excel:
 *             schema:
 *               type: string
 *               format: binary
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Rapport non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/export/:id", exportReport);

export default router;
