FROM node:20-alpine
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm exec turbo run build --filter=@attractory/worker
ENV NODE_ENV=production
USER node
EXPOSE 4001
CMD ["node", "apps/worker/dist/main.js"]
