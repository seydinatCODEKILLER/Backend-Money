import express from "express";
import cors from "cors";
import responseHandler from "./middlewares/responseMiddleware.js";
import logger from "./utils/logger.js";
import { AuthRoute } from "./utils/Router.js";

const app = express();

// Middlewares globaux
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(responseHandler);

// Logger middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

//Route
app.use("/api/auth", AuthRoute.routes);

// Route par défaut pour vérifier que l'API tourne
app.get("/", (req, res) => {
  res.status(200).json({ message: "API is running" });
});

// Route 404 — doit être en dernier
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

export default app;
