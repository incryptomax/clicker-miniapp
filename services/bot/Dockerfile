FROM node:18-alpine

WORKDIR /app

# Copy shared package files first
COPY services/shared/package*.json ./shared/

# Copy service package files
COPY services/bot/package*.json ./

# Install dependencies
RUN npm install

# Copy shared source code to root level for imports
COPY services/shared ./

# Copy service source code
COPY services/bot .

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "run", "start"]