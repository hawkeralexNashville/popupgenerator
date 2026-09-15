import { z } from "zod";

const productionEnvironmentSchema = z.object({
  DATABASE_URL: z.string().url().refine((value) => value.startsWith("postgresql://") || value.startsWith("postgres://"), "must be a PostgreSQL URL"),
  DIRECT_URL: z.string().url().refine((value) => value.startsWith("postgresql://") || value.startsWith("postgres://"), "must be a PostgreSQL URL"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().refine((value) => value.startsWith("https://"), "must use HTTPS"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  INTEGRATION_ENCRYPTION_KEY: z.string().refine((value) => {
    try { return Buffer.from(value, "base64").length === 32; } catch { return false; }
  }, "must be a base64-encoded 32-byte key"),
  NEXT_PUBLIC_APP_URL: z.string().url().refine((value) => value.startsWith("https://"), "must use HTTPS in production"),
});

export function validateProductionEnvironment(environment: NodeJS.ProcessEnv = process.env) {
  if (environment.NODE_ENV !== "production") return;
  const result = productionEnvironmentSchema.safeParse(environment);
  if (!result.success) {
    const details = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid production environment: ${details}`);
  }
}
