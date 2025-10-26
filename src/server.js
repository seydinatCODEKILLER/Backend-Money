// index.js
import app from "./app.js";
import { env } from "./config/env.js";

app.listen(env.PORT, () => {
  console.log(`✅ Serveur démarré sur : http://${env.HOST}:${env.PORT}`);
});
