// controllers/transaction.controller.js
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
      search,
      status = "ACTIVE",
    } = req.query;

    const filters = { userId };

    // Filtre par statut
    if (status !== "ALL") {
      filters.status = status;
    }

    if (type) filters.type = type;
    if (categoryId) filters.categoryId = categoryId;
    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.gte = new Date(startDate);
      if (endDate) filters.date.lte = new Date(endDate);
    }

    // Filtre de recherche
    if (search) {
      filters.OR = [
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          category: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    const transactions = await prisma.transaction.findMany({
      where: filters,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
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

    if (!type) return res.error("Type est requis", 400);
    if (!amount) return res.error("le montant est requis", 400);

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type,
        amount: parseFloat(amount),
        categoryId: categoryId || null,
        description: description || null,
        date: date ? new Date(date) : new Date(),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    });

    // Génération automatique d'alertes pour les dépenses
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
      where: { id, userId },
    });

    if (!transaction) return res.error("Transaction non trouvée", 404);

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        type,
        amount: amount ? parseFloat(amount) : undefined,
        categoryId: categoryId || null,
        description: description || null,
        date: date ? new Date(date) : undefined,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    });

    // Régénération des alertes si c'est une dépense
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
      where: { id, userId },
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

// Nouvelle méthode pour restaurer une transaction
export const restoreTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const transaction = await prisma.transaction.findFirst({
      where: { id, userId, status: "DELETED" },
    });

    if (!transaction) {
      return res.error("Transaction supprimée non trouvée", 404);
    }

    const restoredTransaction = await prisma.transaction.update({
      where: { id },
      data: { status: "ACTIVE" },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    });

    // Régénération des alertes si c'est une dépense
    if (transaction.type === "DEPENSE") {
      await alertService.generateAutomaticAlerts(userId);
    }

    res.success(restoredTransaction, "Transaction restaurée avec succès");
  } catch (error) {
    res.error("Erreur lors de la restauration de la transaction", 500);
  }
};
