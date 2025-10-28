FROM node:20-bullseye AS build   
WORKDIR /app

# Cài npm registry mirror để tránh lỗi mạng npm
RUN npm config set registry https://registry.npmmirror.com

# Copy file lock (nếu có)
COPY frontend/package*.json* ./

# Nếu bạn dùng Yarn hoặc PNPM, copy đúng file lock tương ứng:
# COPY frontend/pnpm-lock.yaml ./
# COPY frontend/yarn.lock ./

# Cài dependencies
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copy toàn bộ source code
COPY frontend ./

# Build production
RUN npm run build

# Serve with Nginx
FROM nginx:1.27-alpine AS runtime

# Copy file build ra thư mục Nginx serve
COPY --from=build /app/dist /usr/share/nginx/html

# Copy config Nginx tùy chỉnh
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
