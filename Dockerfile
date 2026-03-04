FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy server files
COPY server/ ./server/
COPY .env.example ./.env

# Copy and build client
COPY client/ ./client/
WORKDIR /app/client
RUN npm install && npm run build

# Back to root
WORKDIR /app

# Expose backend port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/status', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the server
CMD ["node", "server/index.js"]

