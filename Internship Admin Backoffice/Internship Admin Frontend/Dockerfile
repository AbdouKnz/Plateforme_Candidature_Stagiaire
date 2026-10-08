# ---------- Stage 1: Build ----------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build-time API URL (Vite bakes VITE_* into the bundle).
# Deploy with --build-arg VITE_API_URL=https://talents.parkandcharge.io/backoffice/api
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build


# ---------- Stage 2: Nginx ----------
FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app (Vite base '/backoffice/' -> served under /backoffice/)
COPY --from=builder /app/dist /usr/share/nginx/html/backoffice/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]