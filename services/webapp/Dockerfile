# Build stage
FROM node:18-slim AS builder

WORKDIR /app

# Copy package files
COPY services/shared/package*.json ./shared/
COPY services/webapp/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY services/shared ./shared
COPY services/webapp .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built React app
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY services/webapp/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 3003

# Start nginx
CMD ["nginx", "-g", "daemon off;"]