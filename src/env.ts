import { z, ZodError } from 'zod';
import { formatZodError } from './utils';

const env = z.object({
  NODE_ENV: z.string().min(1),
  PORT: z.string().optional(),

  DISCORD_APP: z.string().min(1),
  DISCORD_TOKEN: z.string().min(1),
  REDIS_URL: z.string().url(),

  OPENAI_TOKEN: z.string().optional(),
});

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof env> {}
  }
}

export const validateEnv = () => {
  try {
    env.parse(process.env);
  } catch (e: unknown) {
    if (e instanceof ZodError) {
      console.error(formatZodError(e));
      process.exit(1);
    } else {
      throw e;
    }
  }
};
