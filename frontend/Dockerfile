# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Extract node_modules instead of npm install
COPY node_modules.tar.gz ./
RUN tar -xzf node_modules.tar.gz && rm node_modules.tar.gz
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.env ./.env

EXPOSE 8080
CMD ["npm", "run", "start"]