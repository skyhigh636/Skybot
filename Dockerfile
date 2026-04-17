FROM node:20-slim

WORKDIR /app

COPY src/package.json src/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src/index.cjs ./index.cjs
COPY src/commands ./commands
COPY src/events ./events
COPY src/images ./images

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "index.cjs"]
