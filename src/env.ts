import { z, ZodError } from 'zod';
import { formatZodError } from './utils';
import 'dotenv/config';

const env = z.object({
  NODE_ENV: z.string().min(1),
  DISCORD_APP: z.string().min(1),
  DISCORD_TOKEN: z.string().min(1),
  REDIS_URL: z.string().url(),
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
