import { z } from 'zod';

export const UserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  roles: z.string(),
});

export const AdminSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(8),
  superAdmin: z.boolean(),
  roles: z.string(),
});

// Mapa de nombres de entidad -> Zod
export const SchemasMap: Record<string, z.ZodTypeAny> = {
  User: UserSchema,
  Admin: AdminSchema,
};
