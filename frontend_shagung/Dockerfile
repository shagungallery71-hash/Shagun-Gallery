# ---------- Stage 1: Build ----------
FROM node:18-alpine AS builder

# Allow customizing Node heap size at build time (default 4096MB)
ARG NODE_MEM=4096
ENV NODE_OPTIONS=--max_old_space_size=${NODE_MEM}
ENV CI=true

WORKDIR /app

# Copy dependency files first (cache optimization)
COPY package*.json ./

# Fix peer dependency conflicts
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Ensure local binaries are available
ENV PATH="/app/node_modules/.bin:$PATH"

# 🔥 FIX: give execute permission to vite
RUN chmod -R +x node_modules/.bin

# Safe & clean Vite build (print NODE_OPTIONS for diagnostics)
RUN echo "NODE_OPTIONS=${NODE_OPTIONS}" && npm run build

# ---------- Stage 2: Serve ----------
FROM nginx:alpine

# Remove default nginx assets
RUN rm -rf /usr/share/nginx/html/*

# Copy build output
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
