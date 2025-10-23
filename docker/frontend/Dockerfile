# Frontend - Build with Node, serve with Nginx
FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package*.json* frontend/pnpm-lock.yaml* frontend/yarn.lock* ./
RUN npm ci || npm install
COPY frontend ./
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
