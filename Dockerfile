FROM node:18-alpine AS builder

WORKDIR /app

COPY backend/server/package*.json ./backend/server/
RUN cd backend/server && npm install

COPY backend/server/tsconfig.json ./backend/server/
COPY backend/server/src/ ./backend/server/src/
RUN cd backend/server && npx tsc

FROM node:18-alpine AS runner

WORKDIR /app

COPY --from=builder /app/backend/server/dist ./dist
COPY --from=builder /app/backend/server/node_modules ./node_modules

EXPOSE 3001

CMD ["node", "dist/index.js"]
