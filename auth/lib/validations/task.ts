import { z } from "zod";

export const taskSchema = z.object({
  title: z
    .string()
    .min(2, "El título debe tener al menos 2 caracteres")
    .max(200, "El título es demasiado largo"),
  description: z
    .string()
    .max(2000, "La descripción es demasiado larga")
    .optional()
    .or(z.literal("")),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).default("PENDING"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  dueDate: z.string().optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  customerId: z.string().optional().or(z.literal("")),
  workerIds: z.array(z.string()).optional().default([]),
});

export const updateTaskSchema = taskSchema.partial().extend({
  id: z.string().min(1, "ID requerido"),
});

// Types
export type TaskInput = z.infer<typeof taskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
