// controllers/DashboardController.js
import DashboardService from "../services/DashboardService.js";

export default class DashboardController {
  constructor() {
    this.service = new DashboardService();
  }

  async getOverview(req, res) {
    try {
      const userId = req.user.id;
      const validPeriods = ["week", "month", "quarter", "year"];
      const period = validPeriods.includes(req.query.period)
        ? req.query.period
        : "month";

      const overview = await this.service.getOverview(userId, period);
      return res.success(
        overview,
        "Données du dashboard récupérées avec succès"
      );
    } catch (error) {
      return res.error(error.message, 500);
    }
  }

  async getExpensesByCategory(req, res) {
    try {
      const userId = req.user.id;
      const validPeriods = ["week", "month", "quarter", "year"];
      const period = validPeriods.includes(req.query.period)
        ? req.query.period
        : "month";

      const data = await this.service.getExpensesByCategory(userId, period);
      return res.success(data, "Dépenses par catégorie récupérées avec succès");
    } catch (error) {
      return res.error(error.message, 500);
    }
  }

  async getMonthlyTrends(req, res) {
    try {
      const userId = req.user.id;
      const months = Math.min(Math.max(parseInt(req.query.months) || 6, 1), 12);
      const data = await this.service.getMonthlyTrends(userId, months);
      return res.success(data, "Tendances mensuelles récupérées avec succès");
    } catch (error) {
      return res.error(error.message, 500);
    }
  }

  async getGlobalBudget(req, res) {
    try {
      const userId = req.user.id;
      const data = await this.service.getGlobalBudget(userId);
      return res.success(data, "Budget global récupéré avec succès");
    } catch (error) {
      return res.error(error.message, 500);
    }
  }
}
