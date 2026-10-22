import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default(process.env.RENDER ? 'production' : 'development'),
  MONGODB_URI: z.string({
    required_error: 'MONGODB_URI is required'
  }).min(1, 'MONGODB_URI cannot be empty'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  JWT_SECRET: z.string({
    required_error: 'JWT_SECRET is required'
  }).min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECRET: z.string({
    required_error: 'COOKIE_SECRET is required'
  }).min(16, 'COOKIE_SECRET must be at least 16 characters'),
  ADMIN_EMAIL: z.string().email().default('admin@thenews.org'),
  ADMIN_PASSWORD: z.string({
    required_error: 'ADMIN_PASSWORD is required'
  }).min(8, 'ADMIN_PASSWORD must be at least 8 characters'),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default('')
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  // Never print raw secrets; print validation issues cleanly
  const issues = parsedEnv.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
  console.error(`Invalid environment configuration: ${issues}`);
  process.exit(1);
}

export const env = parsedEnv.data;
