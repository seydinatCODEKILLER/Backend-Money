import { z } from "zod";

export default class AlertSchema {
  constructor() {}

  validateCreate(data) {
    const schema = z.object({
      type: z.enum(['BUDGET_DEPASSE', 'SEUIL_ATTEINT', 'DEPENSE_IMPORTANTE'], {
        message: "Le type d'alerte doit être BUDGET_DEPASSE, SEUIL_ATTEINT ou DEPENSE_IMPORTANTE"
      }),
      sourceType: z.enum(['GLOBAL', 'CATEGORY', 'TRANSACTION']).default('GLOBAL'),
      categoryId: z.string().optional(),
      message: z.string().min(1, { message: "Le message est requis" }),
      amount: z.number().positive({ message: "Le montant doit être positif" }).optional(),
      threshold: z.number().positive({ message: "Le seuil doit être positif" }).optional(),
    });

    const result = schema.safeParse(data);
    if (!result.success) {
      const errors = Object.entries(result.error.flatten().fieldErrors)
        .map(([field, messages]) => `${field}: ${messages?.join(", ")}`)
        .join(" | ");
      throw new Error(errors);
    }
  }

  validateUpdate(data) {
    const schema = z.object({
      isRead: z.boolean().optional(),
      message: z.string().min(1, { message: "Le message est requis" }).optional(),
    });

    const result = schema.safeParse(data);
    if (!result.success) {
      const errors = Object.entries(result.error.flatten().fieldErrors)
        .map(([field, messages]) => `${field}: ${messages?.join(", ")}`)
        .join(" | ");
      throw new Error(errors);
    }
  }
}