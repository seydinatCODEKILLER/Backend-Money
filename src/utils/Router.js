import AlertRoutes from "../routes/AlertRoutes.js";
import AuthRoutes from "../routes/AuthRoutes.js";
import ChatRoutes from "../routes/ChatRoutes.js";
import DashboardRoutes from "../routes/DashboardRoutes.js";
import RecommendationRoutes from "../routes/RecommendationRoutes.js";

export const AuthRoute = new AuthRoutes();
export const dashboardRoutes = new DashboardRoutes();
export const alertRoutes = new AlertRoutes();
export const chatRoutes = new ChatRoutes();
export const recommandationRoutes = new RecommendationRoutes();