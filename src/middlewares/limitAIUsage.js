export function requireAIPrivilege(req, res, next) {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: "Non authentifié." });
  }

  if (!user.canUseAI) {
    return res.status(403).json({
      message: "Vous n'avez pas accès à cette fonctionnalité IA."
    });
  }

  next();
}

