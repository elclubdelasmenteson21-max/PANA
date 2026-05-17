FROM node:18-alpine

WORKDIR /app

COPY backend/server/package*.json ./
RUN npm install

COPY backend/server/ ./
RUN npx tsc

EXPOSE 3001

CMD ["node", "dist/index.js"]
