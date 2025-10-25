import express from "express";
import DashboardController from "../controllers/DashboardController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

export default class DashboardRoutes {
  constructor() {
    this.router = express.Router();
    this.controller = new DashboardController();
    this.auth = new AuthMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.get("/overview", this.auth.protect(), (req, res) =>
      this.controller.getOverview(req, res)
    );
    this.router.get("/expenses-by-category", this.auth.protect(), (req, res) =>
      this.controller.getExpensesByCategory(req, res)
    );
    this.router.get("/monthly-trends", this.auth.protect(), (req, res) =>
      this.controller.getMonthlyTrends(req, res)
    );
    this.router.get("/global-budget", this.auth.protect(), (req, res) =>
      this.controller.getGlobalBudget(req, res)
    );
  }

  get routes() {
    return this.router;
  }
}
