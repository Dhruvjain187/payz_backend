FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for TypeScript compilation)
RUN npm install

# Copy source code (excluding node_modules via .dockerignore)
COPY . .

# Make start script executable
RUN chmod +x start.sh

# Expose port
EXPOSE 5000

# Use start script as entrypoint
CMD ["./start.sh"]