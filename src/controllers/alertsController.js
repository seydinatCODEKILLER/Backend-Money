import { prisma } from "../config/database.js";

export const getAlerts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { isRead, page = 1, limit = 10 } = req.query;

    const filters = {
      userId,
      status: "ACTIVE",
    };

    if (isRead !== undefined) filters.isRead = isRead === "true";

    const alerts = await prisma.budgetAlert.findMany({
      where: filters,
      include: {
        category: true,
      },
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.budgetAlert.count({ where: filters });

    res.success({
      alerts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.error("Erreur lors de la récupération des alertes", 500);
  }
};

export const markAlertAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const alert = await prisma.budgetAlert.findFirst({
      where: { id, userId, status: "ACTIVE" },
    });

    if (!alert) {
      return res.error("Alerte non trouvée", 404);
    }

    const updatedAlert = await prisma.budgetAlert.update({
      where: { id },
      data: { isRead: true },
    });

    res.success(updatedAlert, "Alerte marquée comme lue");
  } catch (error) {
    res.error("Erreur lors de la mise à jour de l'alerte", 500);
  }
};

export const createAlert = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, sourceType, categoryId, message, amount, threshold } =
      req.body;

    if (!type || !message) {
      return res.error("Type et message sont requis", 400);
    }

    // Validate category ownership if provided
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId, status: "ACTIVE" },
      });
      if (!category) {
        return res.error("Catégorie non trouvée", 404);
      }
    }

    const alert = await prisma.budgetAlert.create({
      data: {
        userId,
        type,
        sourceType: sourceType || "GLOBAL",
        categoryId,
        message,
        amount: amount ? parseFloat(amount) : null,
        threshold: threshold ? parseFloat(threshold) : null,
      },
      include: {
        category: true,
      },
    });

    res.success(alert, "Alerte créée avec succès", 201);
  } catch (error) {
    res.error("Erreur lors de la création de l'alerte", 500);
  }
};
