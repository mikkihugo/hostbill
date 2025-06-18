FROM denoland/deno:2.3.0

# Set working directory
WORKDIR /app

# Copy application files
COPY . .

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Cache dependencies
RUN deno cache --reload main.js

# Expose port
EXPOSE 8000

# Start command
CMD ["run", "-A", "--env", "main.js"]