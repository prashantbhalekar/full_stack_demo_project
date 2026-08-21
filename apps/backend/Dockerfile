FROM node:22-alpine
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN pnpm install --frozen-lockfile=false
COPY . .
RUN pnpm --filter @full-stack-demo/shared-types build
RUN pnpm --filter backend prisma:generate
RUN pnpm --filter backend build
EXPOSE 3001
CMD ["pnpm", "--filter", "backend", "start"]
