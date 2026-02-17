# Use Node.js 22-alpine version
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
# npm ci installs optional dependencies by default, which includes platform-specific native modules
RUN npm ci

# Copy the rest of the application files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the NestJS application
RUN npm run build

# Use a lightweight Node.js image in the final stage
FROM node:22-alpine AS runner

WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

# Load environment variables from .env file
ENV PORT=9001

# Verify platform-specific native modules are available
# Detect platform and ensure the correct native module is installed
# This works for Linux (Alpine/musl), and will install the correct package for the platform
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then \
      PLATFORM_PKG="@css-inline/css-inline-linux-arm64-musl"; \
    else \
      PLATFORM_PKG="@css-inline/css-inline-linux-x64-musl"; \
    fi && \
    if [ ! -d "node_modules/$PLATFORM_PKG" ]; then \
      npm install --no-save --include=optional @css-inline/css-inline || true; \
    fi

# Run Prisma migrations before starting the app
RUN npx prisma generate
CMD npx prisma migrate deploy && npm run seed:ems && node dist/src/main.js

# Expose port
EXPOSE 9001
