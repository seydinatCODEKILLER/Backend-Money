import { prisma } from "../config/database.js";

export default class AlertService {
  constructor() {}

  // Récupérer toutes les alertes d'un utilisateur avec filtres et pagination
  async getUserAlerts(userId, filters = {}) {
    const {
      isRead,
      type,
      sourceType,
      page = 1,
      pageSize = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    const where = { userId, status: "ACTIVE" };
    if (isRead !== undefined) where.isRead = isRead === "true";
    if (type) where.type = type;
    if (sourceType) where.sourceType = sourceType;

    const skip = (page - 1) * pageSize;

    const [alerts, total] = await Promise.all([
      prisma.budgetAlert.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, color: true, icon: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: parseInt(pageSize),
      }),
      prisma.budgetAlert.count({ where }),
    ]);

    const formattedAlerts = alerts.map((alert) => ({
      id: alert.id,
      type: alert.type,
      sourceType: alert.sourceType,
      category: alert.category
        ? {
            id: alert.category.id,
            name: alert.category.name,
            color: alert.category.color,
            icon: alert.category.icon,
          }
        : null,
      message: alert.message,
      amount: alert.amount,
      threshold: alert.threshold,
      isRead: alert.isRead,
      status: alert.status,
      createdAt: alert.createdAt,
      updatedAt: alert.updatedAt,
    }));

    return {
      alerts: formattedAlerts,
      pagination: {
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(total / parseInt(pageSize)),
      },
      filters: { isRead, type, sourceType },
    };
  }

  // Marquer une alerte comme lue
  async markAlertAsRead(userId, alertId) {
    const alert = await prisma.budgetAlert.findFirst({
      where: { id: alertId, userId, status: "ACTIVE" },
    });
    if (!alert) throw new Error("Alerte non trouvée");

    const updatedAlert = await prisma.budgetAlert.update({
      where: { id: alertId },
      data: { isRead: true },
      include: {
        category: { select: { id: true, name: true, color: true, icon: true } },
      },
    });

    return {
      id: updatedAlert.id,
      type: updatedAlert.type,
      sourceType: updatedAlert.sourceType,
      category: updatedAlert.category
        ? {
            id: updatedAlert.category.id,
            name: updatedAlert.category.name,
            color: updatedAlert.category.color,
            icon: updatedAlert.category.icon,
          }
        : null,
      message: updatedAlert.message,
      amount: updatedAlert.amount,
      threshold: updatedAlert.threshold,
      isRead: updatedAlert.isRead,
      status: updatedAlert.status,
      createdAt: updatedAlert.createdAt,
      updatedAt: updatedAlert.updatedAt,
    };
  }

  // Créer une alerte manuelle
  async createManualAlert(userId, alertData) {
    const {
      type,
      sourceType = "GLOBAL",
      categoryId,
      message,
      amount,
      threshold,
    } = alertData;

    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId, status: "ACTIVE" },
      });
      if (!category) throw new Error("Catégorie non trouvée");
    }

    const newAlert = await prisma.budgetAlert.create({
      data: {
        userId,
        type,
        sourceType,
        categoryId,
        message,
        amount,
        threshold,
        isRead: false,
      },
      include: {
        category: { select: { id: true, name: true, color: true, icon: true } },
      },
    });

    return {
      id: newAlert.id,
      type: newAlert.type,
      sourceType: newAlert.sourceType,
      category: newAlert.category
        ? {
            id: newAlert.category.id,
            name: newAlert.category.name,
            color: newAlert.category.color,
            icon: newAlert.category.icon,
          }
        : null,
      message: newAlert.message,
      amount: newAlert.amount,
      threshold: newAlert.threshold,
      isRead: newAlert.isRead,
      status: newAlert.status,
      createdAt: newAlert.createdAt,
      updatedAt: newAlert.updatedAt,
    };
  }

  // ----------------------------
  // Génération automatique optimisée
  // ----------------------------
  async generateAutomaticAlerts(userId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Récupérer toutes les transactions du mois et toutes les catégories avec budget
    const [categories, transactions] = await Promise.all([
      prisma.category.findMany({
        where: { userId, status: "ACTIVE", budgetLimit: { not: null } },
      }),
      prisma.transaction.findMany({
        where: {
          userId,
          type: "DEPENSE",
          status: "ACTIVE",
          date: { gte: startOfMonth, lte: now },
        },
        include: { category: true },
      }),
    ]);

    const alerts = [];

    // Calculer dépenses par catégorie
    const spentByCategory = {};
    for (const t of transactions) {
      if (t.categoryId) {
        spentByCategory[t.categoryId] =
          (spentByCategory[t.categoryId] || 0) + t.amount;
      }
    }

    // Générer alertes budget dépassé et seuil atteint
    for (const category of categories) {
      const spentAmount = spentByCategory[category.id] || 0;
      const budgetLimit = category.budgetLimit || 0;

      if (spentAmount > budgetLimit) {
        // Budget dépassé
        const existingAlert = await prisma.budgetAlert.findFirst({
          where: {
            userId,
            categoryId: category.id,
            type: "BUDGET_DEPASSE",
            status: "ACTIVE",
            isRead: false,
            createdAt: { gte: startOfMonth },
          },
        });
        if (!existingAlert) {
          const alert = await this.createManualAlert(userId, {
            type: "BUDGET_DEPASSE",
            sourceType: "CATEGORY",
            categoryId: category.id,
            message: `Budget dépassé pour ${category.name} : ${spentAmount}€ dépensés sur ${budgetLimit}€`,
            amount: spentAmount,
            threshold: budgetLimit,
          });
          alerts.push(alert);
        }
      } else if (spentAmount >= budgetLimit * 0.9) {
        // Seuil atteint 90%
        const existingAlert = await prisma.budgetAlert.findFirst({
          where: {
            userId,
            categoryId: category.id,
            type: "SEUIL_ATTEINT",
            status: "ACTIVE",
            isRead: false,
            createdAt: { gte: startOfMonth },
          },
        });
        if (!existingAlert) {
          const alert = await this.createManualAlert(userId, {
            type: "SEUIL_ATTEINT",
            sourceType: "CATEGORY",
            categoryId: category.id,
            message: `Seuil d'alerte atteint pour ${
              category.name
            } : ${spentAmount}€ dépensés (${Math.round(
              (spentAmount / budgetLimit) * 100
            )}% du budget)`,
            amount: spentAmount,
            threshold: budgetLimit,
          });
          alerts.push(alert);
        }
      }
    }

    // Dépenses importantes
    const LARGE_EXPENSE_THRESHOLD = 500;
    const largeExpenses = transactions.filter(
      (t) => t.amount >= LARGE_EXPENSE_THRESHOLD
    );

    for (const expense of largeExpenses) {
      const existingAlert = await prisma.budgetAlert.findFirst({
        where: {
          userId,
          type: "DEPENSE_IMPORTANTE",
          sourceType: "TRANSACTION",
          message: { contains: expense.description },
          status: "ACTIVE",
          isRead: false,
          createdAt: { gte: startOfMonth },
        },
      });
      if (!existingAlert) {
        const alert = await this.createManualAlert(userId, {
          type: "DEPENSE_IMPORTANTE",
          sourceType: "TRANSACTION",
          categoryId: expense.categoryId,
          message: `Dépense importante : ${expense.amount}€ pour ${
            expense.description || "sans description"
          }`,
          amount: expense.amount,
        });
        alerts.push(alert);
      }
    }

    return alerts;
  }

  // Statistiques des alertes
  async getAlertStats(userId) {
    const [total, unread, budgetDepasse, seuilAtteint, depenseImportante] =
      await Promise.all([
        prisma.budgetAlert.count({ where: { userId, status: "ACTIVE" } }),
        prisma.budgetAlert.count({
          where: { userId, status: "ACTIVE", isRead: false },
        }),
        prisma.budgetAlert.count({
          where: {
            userId,
            status: "ACTIVE",
            type: "BUDGET_DEPASSE",
            isRead: false,
          },
        }),
        prisma.budgetAlert.count({
          where: {
            userId,
            status: "ACTIVE",
            type: "SEUIL_ATTEINT",
            isRead: false,
          },
        }),
        prisma.budgetAlert.count({
          where: {
            userId,
            status: "ACTIVE",
            type: "DEPENSE_IMPORTANTE",
            isRead: false,
          },
        }),
      ]);

    return {
      total,
      unread,
      byType: { budgetDepasse, seuilAtteint, depenseImportante },
    };
  }
}
