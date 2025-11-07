import { prisma } from "../config/database.js";
import AIService from "./AIService.js";

export default class ChatService {
  constructor() {
    this.aiService = new AIService();
  }

  // Envoyer un message et recevoir réponse
  async sendMessage(userId, content) {
    // Sauvegarder message utilisateur
    const userMessage = await prisma.chatMessage.create({
      data: { userId, content, role: "USER" },
    });

    // Récupérer contexte utilisateur et historique
    const [userContext, conversationHistory] = await Promise.all([
      this.getUserContext(userId),
      this.getRecentMessages(userId, 10), // Derniers 10 messages
    ]);

    // Appel à l'IA avec contexte + historique
    const aiResponse = await this.aiService.answerFinancialQuestion({
      conversationHistory,
      userContext,
      userQuestion: content,
    });

    // Sauvegarder réponse assistant
    const assistantMessage = await prisma.chatMessage.create({
      data: { userId, content: aiResponse, role: "ASSISTANT" },
    });

    return {
      userMessage: this.formatMessage(userMessage),
      assistantMessage: this.formatMessage(assistantMessage),
    };
  }

  // Récupérer contexte financier de l'utilisateur
  async getUserContext(userId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const transactions = await prisma.transaction.findMany({
      where: { userId, status: "ACTIVE", date: { gte: startOfMonth } },
      include: { category: true },
      orderBy: { date: "desc" },
      take: 10,
    });

    const monthlyIncome = transactions
      .filter((t) => t.type === "REVENUE")
      .reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpenses = transactions
      .filter((t) => t.type === "DEPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      monthlyIncome,
      monthlyExpenses,
      monthlySavings: monthlyIncome - monthlyExpenses,
      recentTransactions: transactions.slice(0, 3),
      financialGoals: "Épargner et optimiser mes dépenses", // Exemple par défaut
    };
  }

  // Récupérer les derniers messages
  async getRecentMessages(userId, limit = 10) {
    const messages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Retourner du plus ancien au plus récent
    return messages
      .map((m) => ({
        role: m.role,
        content: m.content,
      }))
      .reverse();
  }

  async getChatHistory(userId, filters = {}) {
    const {
      page = 1,
      pageSize = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;
    const skip = (page - 1) * pageSize;

    const [messages, total] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { userId },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: parseInt(pageSize),
      }),
      prisma.chatMessage.count({ where: { userId } }),
    ]);

    return {
      messages: messages.map((msg) => this.formatMessage(msg)),
      pagination: {
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  formatMessage(message) {
    return {
      id: message.id,
      content: message.content,
      role: message.role,
      createdAt: message.createdAt,
    };
  }

  async clearChatHistory(userId) {
    const result = await prisma.chatMessage.deleteMany({ where: { userId } });
    return { deletedCount: result.count };
  }
}
