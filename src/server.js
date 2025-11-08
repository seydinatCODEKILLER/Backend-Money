// index.js
import app from "./app.js";
import { prisma } from "./config/database.js";
import { env } from "./config/env.js";
console.log("📦 Prisma Models disponibles:", Object.keys(prisma));


app.listen(env.PORT, () => {
  console.log(`✅ Serveur démarré sur : http://${env.HOST}:${env.PORT}`);
});
