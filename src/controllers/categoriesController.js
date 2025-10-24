import { prisma } from "../config/database.js";

export const getCategories = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, page = 1, limit = 10 } = req.query;

    const filters = {
      userId,
      status: "ACTIVE",
    };

    if (type) filters.type = type;

    const categories = await prisma.category.findMany({
      where: filters,
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.category.count({ where: filters });

    res.success({
      categories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.error("Erreur lors de la récupération des catégories", 500);
  }
};

export const createCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, type, color, icon, budgetLimit } = req.body;

    if (!name || !type) {
      return res.error("Nom et type sont requis", 400);
    }

    // Check for unique name per type per user
    const existingCategory = await prisma.category.findFirst({
      where: {
        userId,
        name,
        type,
        status: "ACTIVE",
      },
    });

    if (existingCategory) {
      return res.error("Une catégorie avec ce nom et ce type existe déjà", 400);
    }

    const category = await prisma.category.create({
      data: {
        userId,
        name,
        type,
        color,
        icon,
        budgetLimit: budgetLimit ? parseFloat(budgetLimit) : null,
      },
    });

    res.success(category, "Catégorie créée avec succès", 201);
  } catch (error) {
    res.error("Erreur lors de la création de la catégorie", 500);
  }
};

export const updateCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, type, color, icon, budgetLimit } = req.body;

    const category = await prisma.category.findFirst({
      where: { id, userId, status: "ACTIVE" },
    });

    if (!category) {
      return res.error("Catégorie non trouvée", 404);
    }

    // If updating name or type, check uniqueness
    if (name || type) {
      const newName = name || category.name;
      const newType = type || category.type;
      const existingCategory = await prisma.category.findFirst({
        where: {
          userId,
          name: newName,
          type: newType,
          status: "ACTIVE",
          id: { not: id },
        },
      });

      if (existingCategory) {
        return res.error(
          "Une catégorie avec ce nom et ce type existe déjà",
          400
        );
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name,
        type,
        color,
        icon,
        budgetLimit: budgetLimit ? parseFloat(budgetLimit) : undefined,
      },
    });

    res.success(updatedCategory, "Catégorie mise à jour avec succès");
  } catch (error) {
    res.error("Erreur lors de la mise à jour de la catégorie", 500);
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const category = await prisma.category.findFirst({
      where: { id, userId, status: "ACTIVE" },
    });

    if (!category) {
      return res.error("Catégorie non trouvée", 404);
    }

    await prisma.category.update({
      where: { id },
      data: { status: "DELETED" },
    });

    res.success(null, "Catégorie supprimée avec succès");
  } catch (error) {
    res.error("Erreur lors de la suppression de la catégorie", 500);
  }
};
