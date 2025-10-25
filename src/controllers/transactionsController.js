import { prisma } from "../config/database.js";
import AlertService from "../services/AlertService.js";

const alertService = new AlertService();

export const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      type,
      categoryId,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    const filters = { userId, status: "ACTIVE" };
    if (type) filters.type = type;
    if (categoryId) filters.categoryId = categoryId;
    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.gte = new Date(startDate);
      if (endDate) filters.date.lte = new Date(endDate);
    }

    const transactions = await prisma.transaction.findMany({
      where: filters,
      include: { category: true },
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: { date: "desc" },
    });

    const total = await prisma.transaction.count({ where: filters });

    res.success({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.error("Erreur lors de la récupération des transactions", 500);
  }
};

export const createTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, amount, categoryId, description, date } = req.body;

    if (!type || !amount) return res.error("Type et montant sont requis", 400);

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type,
        amount: parseFloat(amount),
        categoryId,
        description,
        date: date ? new Date(date) : new Date(),
      },
      include: { category: true },
    });

    // -------------------------------
    // GÉNÉRATION AUTOMATIQUE D'ALERTES
    // -------------------------------
    if (type === "DEPENSE") {
      await alertService.generateAutomaticAlerts(userId);
    }

    res.success(transaction, "Transaction créée avec succès", 201);
  } catch (error) {
    res.error("Erreur lors de la création de la transaction", 500);
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { type, amount, categoryId, description, date } = req.body;

    const transaction = await prisma.transaction.findFirst({
      where: { id, userId, status: "ACTIVE" },
    });

    if (!transaction) return res.error("Transaction non trouvée", 404);

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        type,
        amount: amount ? parseFloat(amount) : undefined,
        categoryId,
        description,
        date: date ? new Date(date) : undefined,
      },
      include: { category: true },
    });

    // -------------------------------
    // GÉNÉRATION AUTOMATIQUE D'ALERTES
    // -------------------------------
    if ((type || transaction.type) === "DEPENSE") {
      await alertService.generateAutomaticAlerts(userId);
    }

    res.success(updatedTransaction, "Transaction mise à jour avec succès");
  } catch (error) {
    res.error("Erreur lors de la mise à jour de la transaction", 500);
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const transaction = await prisma.transaction.findFirst({
      where: { id, userId, status: "ACTIVE" },
    });

    if (!transaction) return res.error("Transaction non trouvée", 404);

    await prisma.transaction.update({
      where: { id },
      data: { status: "DELETED" },
    });

    res.success(null, "Transaction supprimée avec succès");
  } catch (error) {
    res.error("Erreur lors de la suppression de la transaction", 500);
  }
};
