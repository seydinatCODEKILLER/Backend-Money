import { prisma } from "../config/database.js";
import AIService from "./AIService.js";

export default class RecommendationService {
  constructor() {
    this.aiService = new AIService();
  }

  // Générer automatiquement des recommandations financières pour un utilisateur
  async generateAutomaticRecommendations(userId) {
    console.log("🔄 [Recommendation] Début génération auto pour user:", userId);

    try {
      const userData = await this.getUserFinancialData(userId);
      console.log("✅ [Recommendation] Données utilisateur récupérées:", {
        transactions: userData.transactions.length,
        budgetAlerts: userData.budgetAlerts.length,
        topCategories: userData.spendingPatterns.topCategories.length,
      });

      const aiRecommendations =
        await this.aiService.generateFinancialRecommendations(userData);

      console.log("🧠 [AI] Réponse brute IA:", aiRecommendations);

      if (!aiRecommendations || typeof aiRecommendations !== "string") {
        console.warn("⚠️ [AI] IA a renvoyé une réponse vide ou invalide.");
        return await this.generateDefaultRecommendations(userId);
      }

      const recommendations = this.parseAIRecommendations(aiRecommendations);

      console.log(
        "📌 [Recommendation] Recommandations interprétées:",
        recommendations
      );

      const saved = [];
      for (const rec of recommendations) {
        const result = await this.saveRecommendation(userId, rec);
        saved.push(result);
      }

      console.log(
        "✅ [Recommendation] Recommandations enregistrées:",
        saved.length
      );

      return saved;
    } catch (error) {
      console.error("❌ [ERROR] generateAutomaticRecommendations:", error);
      return await this.generateDefaultRecommendations(userId);
    }
  }

  // ------------------ Données utilisateur ------------------
  async getUserFinancialData(userId) {
    console.log("🔍 [Recommendation] Récupération données financières...");
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    try {
      const [transactions, categories, budgetAlerts, spendingPatterns] =
        await Promise.all([
          prisma.transaction.findMany({
            where: { userId, status: "ACTIVE", date: { gte: startOfMonth } },
            include: { category: true },
            orderBy: { date: "desc" },
            take: 50,
          }),
          prisma.category.findMany({ where: { userId, status: "ACTIVE" } }),
          prisma.budgetAlert.findMany({
            where: { userId, status: "ACTIVE", isRead: false },
          }),
          this.calculateSpendingPatterns(userId, startOfMonth),
        ]);

      return { transactions, categories, budgetAlerts, spendingPatterns };
    } catch (err) {
      console.error("❌ [ERROR] getUserFinancialData:", err);
      throw err;
    }
  }

  // ------------------ Parsing IA ------------------
  parseAIRecommendations(aiResponse) {
    console.log("🧹 [AI Parsing] Nettoyage du texte IA...");

    const lines = aiResponse.split("\n").filter((l) => l.trim());
    const recommendations = [];

    for (const line of lines) {
      const clean = line.replace(/^[•\-\d\.\s]+/, "").trim();
      if (!clean) continue;

      recommendations.push({
        type: this.determineRecommendationType(clean),
        title: this.generateTitleFromContent(clean),
        message: clean,
        categoryId: null,
      });
    }

    return recommendations.slice(0, 5);
  }

  // ------------------ Stockage DB ------------------
  async saveRecommendation(userId, recommendationData) {
    console.log("💾 [DB] Sauvegarde reco:", recommendationData.title);

    try {
      return await prisma.financialRecommendation.create({
        data: { userId, ...recommendationData },
      });
    } catch (err) {
      console.error("❌ [DB ERROR] saveRecommendation:", err);
      throw err;
    }
  }

  // ------------------ Defaults ------------------
  async generateDefaultRecommendations(userId) {
    console.log("⚠️ [Fallback] Utilisation des recommandations par défaut.");

    const defaults = [
      {
        type: "SPENDING_PATTERN",
        title: "Analysez vos dépenses régulières",
        message:
          "Revoir vos dépenses mensuelles pour identifier les économies possibles.",
      },
      {
        type: "SAVING_OPPORTUNITY",
        title: "Établissez un fonds d'urgence",
        message: "Mettre de côté 3 mois de dépenses pour les imprévus.",
      },
    ];

    const saved = [];
    for (const rec of defaults) {
      saved.push(await this.saveRecommendation(userId, rec));
    }
    return saved;
  }
}
