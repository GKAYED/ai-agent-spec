# Use Node.js 20 Alpine for minimal image size
FROM node:20-alpine

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY src/ ./src/
COPY public/ ./public/

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Set environment variable
ENV NODE_ENV=production
ENV PORT=3000

# Start server
CMD ["node", "src/server.js"]
