// controllers/ChatController.js
import ChatService from "../services/ChatService.js";

export default class ChatController {
  constructor() {
    this.service = new ChatService();
  }

  // POST /api/v1/chat/messages - Envoyer un message
  async sendMessage(req, res) {
    try {
      const userId = req.user.id;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.error("Le message ne peut pas être vide", 400);
      }

      const result = await this.service.sendMessage(userId, content.trim());

      return res.success(result, "Message envoyé avec succès");
    } catch (error) {
      console.error("Erreur dans sendMessage:", error);
      return res.error(error.message, 500);
    }
  }

  // GET /api/v1/chat/messages - Historique des conversations
  async getChatHistory(req, res) {
    try {
      const userId = req.user.id;
      const filters = req.query;

      const result = await this.service.getChatHistory(userId, filters);

      return res.success(result, "Historique récupéré avec succès");
    } catch (error) {
      console.error("Erreur dans getChatHistory:", error);
      return res.error(error.message, 500);
    }
  }

  // DELETE /api/v1/chat/messages - Effacer l'historique
  async clearChatHistory(req, res) {
    try {
      const userId = req.user.id;

      const result = await this.service.clearChatHistory(userId);

      return res.success(result, "Historique effacé avec succès");
    } catch (error) {
      console.error("Erreur dans clearChatHistory:", error);
      return res.error(error.message, 500);
    }
  }
}
