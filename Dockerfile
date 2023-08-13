FROM docker.io/library/node:20-alpine
RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml .
COPY patches patches
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000
CMD [ "pnpm", "run", "start" ]
