FROM docker.io/library/node:20-alpine
RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml .
RUN pnpm install

COPY . .

EXPOSE 3000
CMD [ "pnpm", "run", "start" ]
