import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  company: z.string().max(120).optional().nullable(),
});
