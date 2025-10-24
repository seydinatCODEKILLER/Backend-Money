// routes/AuthRoutes.js
import express from "express";
import AuthController from "../controllers/AuthController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import upload from "../config/multer.js";

export default class AuthRoutes {
  constructor() {
    this.router = express.Router();
    this.controller = new AuthController();
    this.authMiddleware = new AuthMiddleware();

    this.setupRoutes();
  }

  setupRoutes() {
    // Routes publiques
    this.router.post("/register", upload.single('avatar'), (req, res) => this.controller.register(req, res));
    this.router.post("/login", (req, res) => this.controller.login(req, res));
    this.router.post("/forgot-password", (req, res) => this.controller.forgotPassword(req, res));
    this.router.post("/reset-password", (req, res) => this.controller.resetPassword(req, res));
    
    // Routes protégées
    this.router.get("/me", this.authMiddleware.protect(), (req, res) => this.controller.getCurrentUser(req, res));
    this.router.put("/profile", this.authMiddleware.protect(), upload.single('avatar'), (req, res) => this.controller.updateProfile(req, res));
  }

  get routes() {
    return this.router;
  }
}