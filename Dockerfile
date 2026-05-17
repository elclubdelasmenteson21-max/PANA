FROM node:18-slim

WORKDIR /app/backend/server

COPY backend/server/package*.json ./
RUN npm install

COPY backend/server/ ./
RUN npx tsc

EXPOSE 3001

CMD ["node", "dist/index.js"]
