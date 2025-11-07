import { prisma } from "../config/database.js";
import AIService from "./AIService.js";

export default class RecommendationService {
  constructor() {
    this.aiService = new AIService();
  }

  // Générer automatiquement des recommandations financières pour un utilisateur
  async generateAutomaticRecommendations(userId) {
    try {
      const userData = await this.getUserFinancialData(userId);

      const aiRecommendations =
        await this.aiService.generateFinancialRecommendations(userData);

      const recommendations = this.parseAIRecommendations(
        aiRecommendations,
        userId
      );

      const savedRecommendations = [];
      for (const rec of recommendations) {
        const saved = await this.saveRecommendation(userId, rec);
        savedRecommendations.push(saved);
      }

      return savedRecommendations;
    } catch (error) {
      console.error("Erreur dans generateAutomaticRecommendations:", error);
      return await this.generateDefaultRecommendations(userId);
    }
  }

  async getUserFinancialData(userId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

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
  }

  async calculateSpendingPatterns(userId, startDate) {
    const transactions = await prisma.transaction.findMany({
      where: { userId, status: "ACTIVE", date: { gte: startDate } },
      include: { category: true },
    });

    const totalIncome = transactions
      .filter((t) => t.type === "REVENUE")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions
      .filter((t) => t.type === "DEPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    const categorySpending = {};
    transactions
      .filter((t) => t.type === "DEPENSE" && t.category)
      .forEach((t) => {
        const catName = t.category.name;
        categorySpending[catName] = (categorySpending[catName] || 0) + t.amount;
      });

    const topCategories = Object.entries(categorySpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount }));

    return {
      totalIncome,
      totalExpenses,
      topCategories,
      savingsRate:
        totalIncome > 0
          ? ((totalIncome - totalExpenses) / totalIncome) * 100
          : 0,
    };
  }

  parseAIRecommendations(aiResponse, userId) {
    const recommendations = [];
    const lines = aiResponse.split("\n").filter((line) => line.trim());

    lines.forEach((line) => {
      const cleanLine = line.replace(/^[•\-\d\.\s]+/, "").trim();
      if (cleanLine) {
        recommendations.push({
          type: this.determineRecommendationType(cleanLine),
          title: this.generateTitleFromContent(cleanLine),
          message: cleanLine,
          categoryId: null,
        });
      }
    });

    return recommendations.slice(0, 5);
  }

  determineRecommendationType(content) {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes("budget") || lowerContent.includes("dépense"))
      return "BUDGET_ALERT";
    if (lowerContent.includes("épargne") || lowerContent.includes("économ"))
      return "SAVING_OPPORTUNITY";
    if (lowerContent.includes("dette") || lowerContent.includes("crédit"))
      return "DEBT_REDUCTION";
    if (lowerContent.includes("investissement")) return "INVESTMENT_SUGGESTION";
    return "SPENDING_PATTERN";
  }

  generateTitleFromContent(content) {
    const firstSentence = content.split(".")[0];
    return firstSentence.length > 50
      ? firstSentence.substring(0, 47) + "..."
      : firstSentence;
  }

  async saveRecommendation(userId, recommendationData) {
    return await prisma.financialRecommendation.create({
      data: { userId, ...recommendationData },
    });
  }

  async generateDefaultRecommendations(userId) {
    const defaultRecs = [
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
    for (const rec of defaultRecs)
      saved.push(await this.saveRecommendation(userId, rec));
    return saved;
  }

  async getUserRecommendations(userId, { page = 1, pageSize = 9, type }) {
  page = Number(page);
  limit = Number(pageSize);

  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...(type && type.trim() !== "" ? { type } : {})
  };

  const [recommendations, total] = await Promise.all([
    prisma.financialRecommendation.findMany({
      where,
      include: {
        category: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.financialRecommendation.count({ where }),
  ]);

  return {
    recommendations,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}


  async markRecommendationAsRead(userId, recommendationId) {
    const recommendation = await prisma.financialRecommendation.findFirst({
      where: { id: recommendationId, userId },
    });
    if (!recommendation) throw new Error("Recommandation non trouvée");
    return await prisma.financialRecommendation.delete({
      where: { id: recommendationId },
    });
  }
}
