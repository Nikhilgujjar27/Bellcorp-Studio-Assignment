# -------------------------------------------------------------
# Stage 1: Build TypeScript source code
# -------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json tsconfig.json ./

# Install all dependencies including devDependencies for build
RUN npm ci

# Copy server source code
COPY src/ ./src/

# Compile TypeScript to JavaScript in /app/dist
RUN npm run build

# -------------------------------------------------------------
# Stage 2: Production runtime image
# -------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled JavaScript output and static seed SQL from builder
COPY --from=builder /app/dist ./dist
COPY src/config/init.sql ./dist/config/init.sql

EXPOSE 5000

# Start Express server
CMD ["node", "dist/index.js"]
