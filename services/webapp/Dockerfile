# Build stage
FROM node:18-slim as builder

WORKDIR /app

# Copy package files
COPY services/webapp/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY services/webapp .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY services/webapp/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 3003

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
