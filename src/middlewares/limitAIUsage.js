import { env } from "../config/env.js";

export function allowOnlyOneUserForAI(req, res, next) {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Non authentifié." });
  }

  if (userId !== env.ALLOWED_AI_USER_ID) {
    return res.status(403).json( { message: "L'accès à l'IA est limité pour le moment. Revenez plus tard."});
  }

  next();
}
