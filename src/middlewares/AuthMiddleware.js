// middlewares/AuthMiddleware.js
import TokenGenerator from "../config/jwt.js";

export default class AuthMiddleware {
  constructor() {
    this.tokenGenerator = new TokenGenerator();
  }

  protect(roles = []) {
    return (req, res, next) => {
      const authHeader = req.header("authorization");

      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentification requise" });
      }

      const token = authHeader.split(" ")[1];

      let decoded;
      try {
        decoded = this.tokenGenerator.verify(token);
      } catch (error) {
        return res.status(401).json({ message: "Token invalide ou expiré" });
      }

      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({
          message: "Permissions insuffisantes",
        });
      }

      req.user = decoded;
      next();
    };
  }
}
