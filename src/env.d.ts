declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | string;

      DISCORD_APP: string;
      DISCORD_TOKEN: string;

      REDIS_URL: string;
    }
  }
}

export {};
