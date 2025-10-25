import express from "express";
import {
  getAlerts,
  markAlertAsRead,
  createAlert,
} from "../controllers/alertsController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

const router = express.Router();
const auth = new AuthMiddleware();

// Toutes les routes nécessitent une authentification
router.use(auth.protect());

router.get("/", getAlerts);
router.put("/:id/read", markAlertAsRead);
router.post("/", createAlert);

export default router;
