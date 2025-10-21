FROM node:18-slim

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy shared package files first
COPY services/shared/package*.json ./shared/

# Copy service package files
COPY services/api/package*.json ./

# Install dependencies
RUN npm install

# Copy shared source code to root level for imports
COPY services/shared ./

# Copy service source code
COPY services/api .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "run", "start"]