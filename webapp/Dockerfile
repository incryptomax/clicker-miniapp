FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY webapp/package*.json ./

# Install all dependencies (including dev dependencies for linting)
RUN npm install

# Copy source code
COPY webapp .

# Expose port
EXPOSE 3003

# Start the application
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3003"]