import { prisma } from "../config/database.js";

export default class DashboardService {
  constructor() {}

  // =============================
  // VUE D'ENSEMBLE DU DASHBOARD
  // =============================
  async getOverview(userId, period = "month") {
    try {
      const dateRange = this.getDateRange(period);

      const [
        totalRevenue,
        totalExpenses,
        transactionsCount,
        budgetAlertsCount,
        recentTransactions,
        budgetStatus,
      ] = await Promise.all([
        this.getTotalAmount(userId, "REVENUE", dateRange),
        this.getTotalAmount(userId, "DEPENSE", dateRange),
        this.getTransactionsCount(userId, dateRange),
        this.getBudgetAlertsCount(userId),
        this.getRecentTransactions(userId, 5),
        this.getBudgetStatus(userId, dateRange),
      ]);

      const balance = totalRevenue - totalExpenses;

      return {
        summary: {
          balance,
          totalRevenue,
          totalExpenses,
          transactionsCount,
          budgetAlertsCount,
        },
        budgetStatus,
        recentTransactions,
        period: this.getPeriodDisplay(period),
      };
    } catch (error) {
      console.error("Erreur dans getOverview:", error);
      throw new Error(
        "Erreur lors de la récupération des données du dashboard"
      );
    }
  }

  // =============================
  // DEPENSES PAR CATEGORIE
  // =============================
  async getExpensesByCategory(userId, period = "month") {
    try {
      const dateRange = this.getDateRange(period);

      const expensesByCategory = await prisma.transaction.groupBy({
        by: ["categoryId"],
        where: {
          userId,
          type: "DEPENSE",
          status: "ACTIVE",
          date: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      });

      const categoryIds = expensesByCategory
        .map((item) => item.categoryId)
        .filter(Boolean);
      const categories = await prisma.category.findMany({
        where: { id: { in: categoryIds }, status: "ACTIVE" },
        select: { id: true, name: true, color: true, icon: true },
      });

      const categoryMap = new Map(categories.map((cat) => [cat.id, cat]));

      const chartData = expensesByCategory.map((item) => {
        const category = categoryMap.get(item.categoryId);
        return {
          id: item.categoryId || "autres",
          name: category?.name || "Non catégorisé",
          value: item._sum.amount || 0,
          count: item._count.id,
          color: category?.color || "#6B7280",
          icon: category?.icon || "📁",
        };
      });

      chartData.sort((a, b) => b.value - a.value);
      const total = chartData.reduce((sum, item) => sum + item.value, 0);

      return {
        data: chartData.map((item) => ({
          ...item,
          percentage: total > 0 ? Math.round((item.value / total) * 100) : 0,
        })),
        total,
        period: this.getPeriodDisplay(period),
      };
    } catch (error) {
      console.error("Erreur dans getExpensesByCategory:", error);
      throw new Error(
        "Erreur lors de la récupération des dépenses par catégorie"
      );
    }
  }

  // =============================
  // TENDANCES MENSUELLES
  // =============================
  async getMonthlyTrends(userId, months = 6) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months + 1);
      startDate.setDate(1);

      const monthsList = this.generateMonthsList(months);

      const detailedData = await prisma.transaction.groupBy({
        by: ["type", "date"],
        where: {
          userId,
          status: "ACTIVE",
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      });

      const trendsData = monthsList.map((month) => {
        const monthKey = `${month.year}-${month.month
          .toString()
          .padStart(2, "0")}`;
        const monthTransactions = detailedData.filter((d) => {
          const date = new Date(d.date);
          return (
            `${date.getFullYear()}-${(date.getMonth() + 1)
              .toString()
              .padStart(2, "0")}` === monthKey
          );
        });

        const revenue = monthTransactions
          .filter((t) => t.type === "REVENUE")
          .reduce((sum, t) => sum + (t._sum.amount || 0), 0);
        const expenses = monthTransactions
          .filter((t) => t.type === "DEPENSE")
          .reduce((sum, t) => sum + (t._sum.amount || 0), 0);

        return {
          month: month.label,
          period: monthKey,
          revenue,
          expenses,
          balance: revenue - expenses,
        };
      });

      return {
        data: trendsData,
        summary: {
          totalRevenue: trendsData.reduce((sum, t) => sum + t.revenue, 0),
          totalExpenses: trendsData.reduce((sum, t) => sum + t.expenses, 0),
        },
        period: `${months} derniers mois`,
      };
    } catch (error) {
      console.error("Erreur dans getMonthlyTrends:", error);
      throw new Error(
        "Erreur lors de la récupération des tendances mensuelles"
      );
    }
  }

  // =============================
  // BUDGET GLOBAL
  // =============================
  async getGlobalBudget(userId) {
    const categories = await prisma.category.findMany({
      where: { userId, status: "ACTIVE" },
      select: { budgetLimit: true },
    });
    const budgetGlobal = categories.reduce(
      (acc, cat) => acc + (cat.budgetLimit || 0),
      0
    );
    return { budgetGlobal };
  }

  // =============================
  // MÉTHODES UTILITAIRES
  // =============================
  getDateRange(period) {
    const now = new Date();
    const start = new Date();
    switch (period) {
      case "week":
        start.setDate(now.getDate() - 7);
        break;
      case "month":
        start.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        start.setMonth(now.getMonth() - 3);
        break;
      case "year":
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        start.setMonth(now.getMonth() - 1);
    }
    return { start, end: now };
  }

  getPeriodDisplay(period) {
    const map = {
      week: "7 derniers jours",
      month: "30 derniers jours",
      quarter: "3 derniers mois",
      year: "12 derniers mois",
    };
    return map[period] || "30 derniers jours";
  }

  generateMonthsList(count) {
    const months = [];
    const now = new Date();
    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        label: date.toLocaleDateString("fr-FR", {
          month: "short",
          year: "numeric",
        }),
      });
    }
    return months;
  }

  async getTotalAmount(userId, type, dateRange) {
    const result = await prisma.transaction.aggregate({
      where: {
        userId,
        type,
        status: "ACTIVE",
        date: { gte: dateRange.start, lte: dateRange.end },
      },
      _sum: { amount: true },
    });
    return result._sum.amount || 0;
  }

  async getTransactionsCount(userId, dateRange) {
    return prisma.transaction.count({
      where: {
        userId,
        status: "ACTIVE",
        date: { gte: dateRange.start, lte: dateRange.end },
      },
    });
  }

  async getBudgetAlertsCount(userId) {
    return prisma.budgetAlert.count({
      where: { userId, status: "ACTIVE", isRead: false },
    });
  }

  async getRecentTransactions(userId, limit = 5) {
    const transactions = await prisma.transaction.findMany({
      where: { userId, status: "ACTIVE" },
      include: {
        category: { select: { name: true, color: true, icon: true } },
      },
      orderBy: { date: "desc" },
      take: limit,
    });

    return transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      description: t.description,
      date: t.date,
      category: t.category?.name || "Non catégorisé",
      color: t.category?.color || "#6B7280",
      icon: t.category?.icon || "📁",
    }));
  }

  async getBudgetStatus(userId, dateRange) {
    const categories = await prisma.category.findMany({
      where: { userId, status: "ACTIVE", budgetLimit: { not: null } },
      select: {
        id: true,
        name: true,
        budgetLimit: true,
        color: true,
        icon: true,
      },
    });

    const results = await Promise.all(
      categories.map(async (c) => {
        const spent = await prisma.transaction.aggregate({
          where: {
            userId,
            categoryId: c.id,
            type: "DEPENSE",
            status: "ACTIVE",
            date: { gte: dateRange.start, lte: dateRange.end },
          },
          _sum: { amount: true },
        });

        const spentAmount = spent._sum.amount || 0;
        const percentage =
          c.budgetLimit > 0
            ? Math.min(Math.round((spentAmount / c.budgetLimit) * 100), 100)
            : 0;
        return {
          categoryId: c.id,
          categoryName: c.name,
          spent: spentAmount,
          budget: c.budgetLimit,
          remaining: Math.max(c.budgetLimit - spentAmount, 0),
          percentage,
          color: c.color,
          icon: c.icon,
          status:
            percentage >= 90 ? "danger" : percentage >= 75 ? "warning" : "safe",
        };
      })
    );

    return results.filter((r) => r.budget > 0);
  }
}
