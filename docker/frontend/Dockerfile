# Stage 1: Build
FROM node:20-bullseye AS build
WORKDIR /app

# Bỏ validate SSL tạm thời để tránh lỗi SELF_SIGNED_CERT_IN_CHAIN
RUN npm config set strict-ssl false

# Cài npm registry mirror (hoặc npm chính)
RUN npm config set registry https://registry.npmmirror.com

# Copy package.json & lock file
COPY frontend/package*.json* ./

# Cài dependencies
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copy toàn bộ source code
COPY frontend ./ 

# Build production
RUN npm run build

# Stage 2: Serve với Nginx
FROM nginx:1.27-alpine AS runtime

# Copy build ra thư mục Nginx serve
COPY --from=build /app/dist /usr/share/nginx/html

# Copy config Nginx tùy chỉnh
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
