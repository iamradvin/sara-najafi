FROM node:20-alpine
WORKDIR /app
RUN corepack enable
RUN apk add --no-cache openssl
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @attractory/api db:generate
RUN pnpm exec turbo run build --filter=@attractory/api
RUN mkdir -p /app/apps/api/uploads && chown -R node:node /app
ENV NODE_ENV=production
USER node
EXPOSE 4000
CMD ["sh", "-c", "pnpm --filter @attractory/api db:migrate:deploy && exec node apps/api/dist/src/main.js"]
