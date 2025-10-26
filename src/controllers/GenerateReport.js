import { prisma } from "../config/database.js";

export const generateReportData = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reportType, startDate, endDate, categoryId } = req.body;

    if (!reportType || !startDate || !endDate) {
      return res.error(
        "Type de rapport, date de début et date de fin sont requis",
        400
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Filtre transactions
    const filters = {
      userId,
      status: "ACTIVE",
      date: {
        gte: start,
        lte: end,
      },
    };
    if (categoryId) filters.categoryId = categoryId;

    const transactions = await prisma.transaction.findMany({
      where: filters,
      include: { category: true },
    });

    let reportData = {};

    switch (reportType) {
      case "monthly-summary":
        reportData = generateMonthlySummary(transactions);
        break;
      case "category-breakdown":
        reportData = generateCategoryBreakdown(transactions);
        break;
      case "budget-vs-actual":
        const categories = await prisma.category.findMany({
          where: { userId, status: "ACTIVE", budgetLimit: { not: null } },
        });
        reportData = generateBudgetVsActual(transactions, categories);
        break;
      default:
        return res.error("Type de rapport non valide", 400);
    }

    res.success(
      {
        reportType,
        startDate,
        endDate,
        transactions,
        reportData,
      },
      "Données du rapport prêtes pour génération côté front",
      200
    );
  } catch (error) {
    console.error(error);
    res.error("Erreur lors de la récupération des données du rapport", 500);
  }
};

// --- Fonctions helper ---
function generateMonthlySummary(transactions) {
  const summary = {
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    transactionCount: transactions.length,
  };

  transactions.forEach((tx) => {
    if (tx.type === "REVENUE") summary.totalRevenue += tx.amount;
    else summary.totalExpenses += tx.amount;
  });

  summary.netIncome = summary.totalRevenue - summary.totalExpenses;
  return summary;
}

function generateCategoryBreakdown(transactions) {
  const breakdown = {};
  transactions.forEach((tx) => {
    const name = tx.category?.name || "Sans catégorie";
    if (!breakdown[name])
      breakdown[name] = { total: 0, count: 0, type: tx.type };
    breakdown[name].total += tx.amount;
    breakdown[name].count += 1;
  });
  return breakdown;
}

function generateBudgetVsActual(transactions, categories) {
  const comparison = {};
  categories.forEach((cat) => {
    const categoryTx = transactions.filter(
      (tx) => tx.categoryId === cat.id && tx.type === "DEPENSE"
    );
    const actualSpent = categoryTx.reduce((sum, tx) => sum + tx.amount, 0);

    comparison[cat.name] = {
      budget: cat.budgetLimit,
      actual: actualSpent,
      difference: cat.budgetLimit - actualSpent,
      percentage:
        cat.budgetLimit > 0 ? (actualSpent / cat.budgetLimit) * 100 : 0,
    };
  });
  return comparison;
}
