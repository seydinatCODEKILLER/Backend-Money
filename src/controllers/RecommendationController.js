// controllers/RecommendationController.js
import RecommendationService from "../services/RecommendationService.js";

export default class RecommendationController {
  constructor() {
    this.service = new RecommendationService();
  }

  async getRecommendations(req, res) {
    try {
      const userId = req.user.id;
      const filters = req.query;

      const result = await this.service.getUserRecommendations(userId, filters);

      return res.success(result, "Recommandations récupérées avec succès");
    } catch (error) {
      console.error("Erreur dans getRecommendations:", error);
      return res.error(error.message, 500);
    }
  }

  async generateRecommendations(req, res) {
    try {
      const userId = req.user.id;

      const recommendations =
        await this.service.generateAutomaticRecommendations(userId);

      return res.success(
        {
          generated: recommendations.length,
          recommendations,
        },
        `Recommandations générées avec succès (${recommendations.length} nouvelles)`
      );
    } catch (error) {
      console.error("Erreur dans generateRecommendations:", error);
      return res.error(error.message, 500);
    }
  }

  async deleteRecommendation(req, res) {
    try {
      const userId = req.user.id;
      const recommendationId = req.params.id;

      await this.service.markRecommendationAsRead(userId, recommendationId);

      return res.success(null, "Recommandation supprimée avec succès");
    } catch (error) {
      console.error("Erreur dans deleteRecommendation:", error);
      const statusCode = error.message.includes("non trouvée") ? 404 : 500;
      return res.error(error.message, statusCode);
    }
  }
}
