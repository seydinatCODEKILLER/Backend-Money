import express from "express";
import {
  getReports,
  generateReport,
  exportReport,
} from "../controllers/reportsController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

const router = express.Router();
const auth = new AuthMiddleware();

// Toutes les routes nécessitent une authentification
router.use(auth.protect());

router.get("/", getReports);
router.post("/", generateReport);
router.get("/export/:id", exportReport);

export default router;
