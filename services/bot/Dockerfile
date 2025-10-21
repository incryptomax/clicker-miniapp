FROM node:18-slim

WORKDIR /app

# Install OpenSSL for Redis connections
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY services/shared/package*.json ./shared/
COPY services/bot/package*.json ./

# Install dependencies
RUN npm install

# Copy shared modules
COPY services/shared ./

# Copy bot source code
COPY services/bot .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]