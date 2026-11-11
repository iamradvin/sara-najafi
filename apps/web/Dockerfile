FROM node:20-alpine
WORKDIR /app
RUN corepack enable
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm exec turbo run build --filter=@attractory/web
RUN chown -R node:node /app/apps/web/.next
ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["node", "apps/web/node_modules/next/dist/bin/next", "start", "--hostname", "0.0.0.0"]
