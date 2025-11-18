# Multi-stage build for frontend

# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY packages/frontend/package.json ./packages/frontend/

# Install dependencies
RUN npm ci

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/frontend/node_modules ./packages/frontend/node_modules

# Copy source code
COPY packages/frontend ./packages/frontend

# Build Next.js application
WORKDIR /app/packages/frontend
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

# Install dumb-init
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set environment
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/packages/frontend/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/packages/frontend/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/packages/frontend/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/packages/frontend/public ./public

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start Next.js
CMD ["npm", "start"]
