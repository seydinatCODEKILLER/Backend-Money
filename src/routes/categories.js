import express from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoriesController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

const router = express.Router();
const auth = new AuthMiddleware();

// Toutes les routes nécessitent une authentification
router.use(auth.protect());

router.get("/", getCategories);
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
