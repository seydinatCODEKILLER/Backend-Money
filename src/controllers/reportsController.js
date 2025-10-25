import { prisma } from "../config/database.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export const getReports = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const reports = await prisma.report.findMany({
      where: { userId, status: "ACTIVE" },
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.report.count({
      where: { userId, status: "ACTIVE" },
    });

    res.success({
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.error("Erreur lors de la récupération des rapports", 500);
  }
};

export const generateReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reportType, startDate, endDate, categoryId, title, description } =
      req.body;

    if (!reportType || !startDate || !endDate) {
      return res.error(
        "Type de rapport, date de début et date de fin sont requis",
        400
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

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
      include: {
        category: true,
      },
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
        reportData = await generateBudgetVsActual(
          userId,
          transactions,
          start,
          end
        );
        break;
      default:
        return res.error("Type de rapport non valide", 400);
    }

    // Generate PDF
    const pdfPath = await generatePDFReport(
      reportType,
      reportData,
      start,
      end,
      title || `Rapport ${reportType}`
    );

    // Save report to database
    const report = await prisma.report.create({
      data: {
        userId,
        title: title || `Rapport ${reportType}`,
        description,
        startDate: start,
        endDate: end,
        totalIncome: reportData.totalRevenue || 0,
        totalExpense: reportData.totalExpenses || 0,
        balance:
          (reportData.totalRevenue || 0) - (reportData.totalExpenses || 0),
        fileUrl: pdfPath,
      },
    });

    res.success(report, "Rapport généré avec succès", 201);
  } catch (error) {
    res.error("Erreur lors de la génération du rapport", 500);
  }
};

export const exportReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { format = "pdf" } = req.query;

    const report = await prisma.report.findFirst({
      where: { id, userId, status: "ACTIVE" },
    });

    if (!report) {
      return res.error("Rapport non trouvé", 404);
    }

    if (format === "pdf" && report.fileUrl) {
      // Send PDF file
      const filePath = path.resolve(report.fileUrl);
      if (fs.existsSync(filePath)) {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${report.title}.pdf"`
        );
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
      } else {
        return res.error("Fichier PDF non trouvé", 404);
      }
    } else if (format === "json") {
      // Send JSON data
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${report.title}.json"`
      );
      res.send(JSON.stringify(report, null, 2));
    } else {
      return res.error("Format non supporté", 400);
    }
  } catch (error) {
    res.error("Erreur lors de l'export du rapport", 500);
  }
};

// Helper functions
function generateMonthlySummary(transactions) {
  const summary = {
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    transactionCount: transactions.length,
  };

  transactions.forEach((transaction) => {
    if (transaction.type === "REVENUE") {
      summary.totalRevenue += transaction.amount;
    } else {
      summary.totalExpenses += transaction.amount;
    }
  });

  summary.netIncome = summary.totalRevenue - summary.totalExpenses;

  return summary;
}

function generateCategoryBreakdown(transactions) {
  const breakdown = {};

  transactions.forEach((transaction) => {
    const categoryName = transaction.category?.name || "Sans catégorie";
    if (!breakdown[categoryName]) {
      breakdown[categoryName] = {
        total: 0,
        count: 0,
        type: transaction.type,
      };
    }
    breakdown[categoryName].total += transaction.amount;
    breakdown[categoryName].count += 1;
  });

  return breakdown;
}

async function generateBudgetVsActual(userId, transactions, start, end) {
  const categories = await prisma.category.findMany({
    where: { userId, status: "ACTIVE", budgetLimit: { not: null } },
  });

  const comparison = {};

  categories.forEach((category) => {
    const categoryTransactions = transactions.filter(
      (t) => t.categoryId === category.id && t.type === "DEPENSE"
    );
    const actualSpent = categoryTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    comparison[category.name] = {
      budget: category.budgetLimit,
      actual: actualSpent,
      difference: category.budgetLimit - actualSpent,
      percentage:
        category.budgetLimit > 0
          ? (actualSpent / category.budgetLimit) * 100
          : 0,
    };
  });

  return comparison;
}

async function generatePDFReport(reportType, data, startDate, endDate, title) {
  return new Promise((resolve, reject) => {
    const reportsDir = path.join(process.cwd(), "reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const fileName = `report_${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Header
    doc.fontSize(20).text(title, { align: "center" });
    doc.moveDown();
    doc
      .fontSize(12)
      .text(
        `Période: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        { align: "center" }
      );
    doc.moveDown(2);

    // Content based on report type
    if (reportType === "monthly-summary") {
      doc.fontSize(16).text("Résumé Mensuel", { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Total Revenus: ${data.totalRevenue.toFixed(2)} €`);
      doc.text(`Total Dépenses: ${data.totalExpenses.toFixed(2)} €`);
      doc.text(`Revenus Nets: ${data.netIncome.toFixed(2)} €`);
      doc.text(`Nombre de transactions: ${data.transactionCount}`);
    } else if (reportType === "category-breakdown") {
      doc.fontSize(16).text("Répartition par Catégorie", { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      Object.entries(data).forEach(([category, info]) => {
        doc.text(
          `${category}: ${info.total.toFixed(2)} € (${info.count} transactions)`
        );
      });
    } else if (reportType === "budget-vs-actual") {
      doc.fontSize(16).text("Budget vs Réel", { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      Object.entries(data).forEach(([category, info]) => {
        doc.text(`${category}:`);
        doc.text(`  Budget: ${info.budget.toFixed(2)} €`);
        doc.text(`  Réel: ${info.actual.toFixed(2)} €`);
        doc.text(`  Différence: ${info.difference.toFixed(2)} €`);
        doc.text(`  Pourcentage: ${info.percentage.toFixed(2)}%`);
        doc.moveDown();
      });
    }

    // Footer
    doc.moveDown(2);
    doc
      .fontSize(10)
      .text(`Généré le ${new Date().toLocaleString()}`, { align: "center" });

    doc.end();

    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
}
