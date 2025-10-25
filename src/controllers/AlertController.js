// controllers/AlertController.js
import AlertService from "../services/AlertService.js";
import AlertSchema from "../schemas/AlertSchema.js";

export default class AlertController {
  constructor() {
    this.service = new AlertService();
    this.schema = new AlertSchema();
  }

  // GET /api/v1/alerts - Liste des alertes
  async getAlerts(req, res) {
    try {
      const userId = req.user.id;
      const filters = req.query;

      const result = await this.service.getUserAlerts(userId, filters);

      return res.success(result, "Alertes récupérées avec succès");
    } catch (error) {
      console.error("Erreur dans getAlerts:", error);
      return res.error(error.message, 500);
    }
  }

  // PUT /api/v1/alerts/:id/read - Marquer comme lue
  async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const alertId = req.params.id;

      const updatedAlert = await this.service.markAlertAsRead(userId, alertId);

      return res.success(updatedAlert, "Alerte marquée comme lue avec succès");
    } catch (error) {
      console.error("Erreur dans markAsRead:", error);
      const statusCode = error.message.includes("non trouvée") ? 404 : 500;
      return res.error(error.message, statusCode);
    }
  }

  // POST /api/v1/alerts - Créer une alerte manuelle
  async createAlert(req, res) {
    try {
      const userId = req.user.id;
      const alertData = req.body;

      // Validation des données
      this.schema.validateCreate(alertData);

      const newAlert = await this.service.createManualAlert(userId, alertData);

      return res.success(newAlert, "Alerte créée avec succès", 201);
    } catch (error) {
      console.error("Erreur dans createAlert:", error);
      return res.error(error.message, 400);
    }
  }

  // GET /api/v1/alerts/stats - Statistiques des alertes
  async getAlertStats(req, res) {
    try {
      const userId = req.user.id;

      const stats = await this.service.getAlertStats(userId);

      return res.success(
        stats,
        "Statistiques des alertes récupérées avec succès"
      );
    } catch (error) {
      console.error("Erreur dans getAlertStats:", error);
      return res.error(error.message, 500);
    }
  }

  // POST /api/v1/alerts/generate - Générer des alertes automatiques (pour tests)
  async generateAlerts(req, res) {
    try {
      const userId = req.user.id;

      const generatedAlerts = await this.service.generateAutomaticAlerts(
        userId
      );

      return res.success(
        {
          generated: generatedAlerts.length,
          alerts: generatedAlerts,
        },
        `Alertes automatiques générées avec succès (${generatedAlerts.length} nouvelles alertes)`
      );
    } catch (error) {
      console.error("Erreur dans generateAlerts:", error);
      return res.error(error.message, 500);
    }
  }
}
