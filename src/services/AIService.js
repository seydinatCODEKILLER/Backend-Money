import Groq from "groq-sdk";
import { env } from "../config/env.js";

export default class AIService {
  constructor() {
    this.client = new Groq({ apiKey: env.GROQ_API_KEY });
    this.model = "llama-3.1-8b-instant";
  }

  async callAIModel(messages, options = {}) {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: options.max_tokens || 500,
        temperature: options.temperature || 0.7,
      });

      return (
        completion.choices?.[0]?.message?.content || "Réponse non disponible."
      );
    } catch (error) {
      console.error("Erreur IA Groq:", error);
      return "Désolé, le service IA est temporairement indisponible.";
    }
  }

  async generateFinancialRecommendations(userData) {
    const { transactions, budgetAlerts, spendingPatterns } = userData;

    const prompt = `
Analyse les données et propose 3 à 5 recommandations financières claires, personnalisées et réalistes.

Revenus : ${spendingPatterns.totalIncome}€
Dépenses : ${spendingPatterns.totalExpenses}€
Catégories principales : ${JSON.stringify(spendingPatterns.topCategories)}
Alertes budgétaires : ${budgetAlerts.length}

Transactions récentes :
${transactions
  .slice(0, 10)
  .map(
    (t) =>
      `- ${t.date}: ${t.amount}€ pour ${t.description || "Non précisé"} (${
        t.category?.name || "Non catégorisé"
      })`
  )
  .join("\n")}

Réponds en français, sous forme de bullet points.
`;

    return await this.callAIModel([
      {
        role: "system",
        content: "Tu es MoneyWise, assistant financier expert.",
      },
      { role: "user", content: prompt },
    ]);
  }

  async answerFinancialQuestion({
    conversationHistory,
    userContext,
    userQuestion,
  }) {
    // Construire les messages pour Grok
    const messages = [
      {
        role: "system",
        content: `
Tu es MoneyWise, assistant financier expert.
Fournis des conseils clairs, concis et pratiques.
Prends en compte le contexte financier et l'historique de conversation.
Réponds toujours en français.
        `,
      },
      // Ajouter l'historique
      ...conversationHistory.map((msg) => ({
        role: msg.role.toLowerCase(), // "user" ou "assistant"
        content: msg.content,
      })),
      // Nouveau message
      {
        role: "user",
        content: `
CONTEXTE FINANCIER :
- Revenus mensuels : ${userContext.monthlyIncome || "Non spécifié"}€
- Dépenses mensuelles : ${userContext.monthlyExpenses || "Non spécifié"}€
- Épargne mensuelle : ${userContext.monthlySavings || "Non spécifié"}€
- Objectifs financiers : ${userContext.financialGoals || "Non spécifiés"}

QUESTION :
${userQuestion}
        `,
      },
    ];

    return await this.callAIModel(messages, { max_tokens: 500 });
  }
}
