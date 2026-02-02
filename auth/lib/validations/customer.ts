import { z } from "zod";

export const customerSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre es demasiado largo"),
  email: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .max(20, "El teléfono es demasiado largo")
    .optional()
    .or(z.literal("")),
  dni: z
    .string()
    .max(20, "El DNI/NIF es demasiado largo")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .max(200, "La dirección es demasiado larga")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(1000, "Las notas son demasiado largas")
    .optional()
    .or(z.literal("")),
  category: z.enum(["PREMIUM", "REGULAR", "OCCASIONAL"]).default("REGULAR"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  workerIds: z.array(z.string()).optional().default([]),
});

export const updateCustomerSchema = customerSchema.partial().extend({
  id: z.string().min(1, "ID requerido"),
});

// Types
export type CustomerInput = z.infer<typeof customerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
