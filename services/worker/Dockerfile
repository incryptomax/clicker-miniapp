FROM node:18-slim

WORKDIR /app

# Install OpenSSL for Prisma (if needed)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy shared package.json and install dependencies
COPY services/shared/package*.json ./shared/
# Copy worker package.json and install dependencies
COPY services/worker/package*.json ./

RUN npm install

# Copy shared source code
COPY services/shared ./shared/
# Copy worker source code
COPY services/worker .

RUN npm run build

CMD ["npm", "run", "start"]