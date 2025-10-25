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
    // GET /api/v1/alerts - Liste des alertes avec filtres
    this.router.get("/", this.authMiddleware.protect(), (req, res) =>
      this.controller.getAlerts(req, res)
    );

    // GET /api/v1/alerts/stats - Statistiques des alertes
    this.router.get("/stats", this.authMiddleware.protect(), (req, res) =>
      this.controller.getAlertStats(req, res)
    );

    // PUT /api/v1/alerts/:id/read - Marquer une alerte comme lue
    this.router.put("/:id/read", this.authMiddleware.protect(), (req, res) =>
      this.controller.markAsRead(req, res)
    );

    // POST /api/v1/alerts - Créer une alerte manuelle
    this.router.post("/", this.authMiddleware.protect(), (req, res) =>
      this.controller.createAlert(req, res)
    );

    // POST /api/v1/alerts/generate - Générer des alertes automatiques (pour tests)
    this.router.post("/generate", this.authMiddleware.protect(), (req, res) =>
      this.controller.generateAlerts(req, res)
    );
  }

  get routes() {
    return this.router;
  }
}
