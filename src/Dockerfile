FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY src/ ./src/

# Create data directory for database
RUN mkdir -p /app/data

# Expose port
EXPOSE 8000

# Add non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S cloudiq -u 1001
RUN chown -R cloudiq:nodejs /app
USER cloudiq

# Start command
CMD ["node", "src/main.js"]