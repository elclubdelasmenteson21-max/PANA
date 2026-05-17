FROM node:18-alpine

WORKDIR /app

COPY backend/server/package*.json ./
RUN npm install --production

COPY backend/server/dist ./dist
COPY backend/server/.env.example ./.env

EXPOSE 3001

CMD ["node", "dist/index.js"]
