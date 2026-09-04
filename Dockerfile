FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache ca-certificates openssl

FROM base AS deps
COPY package.json ./
RUN npm install

FROM deps AS development
COPY . .
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM deps AS builder
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "run", "start"]
