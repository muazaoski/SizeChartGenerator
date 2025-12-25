# Build stage
FROM node:22-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM caddy:2-alpine

# Copy the built files
COPY --from=build /app/dist /usr/share/caddy

# Simple Caddyfile for SPA
COPY Caddyfile.container /etc/caddy/Caddyfile

EXPOSE 80
