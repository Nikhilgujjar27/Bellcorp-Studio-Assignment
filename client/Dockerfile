# -------------------------------------------------------------
# Stage 1: Build React Vite application
# -------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json tsconfig*.json vite.config.ts tailwind.config.js postcss.config.js index.html ./

# Install dependencies
RUN npm ci

# Copy client source code
COPY src/ ./src/

# Compile production bundle
RUN npm run build

# -------------------------------------------------------------
# Stage 2: Production Nginx web server
# -------------------------------------------------------------
FROM nginx:alpine AS runner

# Copy compiled React output to Nginx document root
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx SPA reverse proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
