import { z } from "zod";

/** Owner login credentials (single admin). */
export const loginSchema = z.object({
  email: z.email().max(160),
  password: z.string().min(6).max(200),
});

export type LoginInput = z.infer<typeof loginSchema>;
