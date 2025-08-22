# Multi-stage build for optimized production image
FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Dependencies stage
FROM base AS deps
COPY server/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Build stage for client
FROM base AS client-build
COPY client/package*.json ./client/
RUN cd client && npm ci
COPY client ./client
RUN cd client && npm run build

# Production stage
FROM base AS production
ENV NODE_ENV=production
ENV PORT=5000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY server ./

# Copy built client
COPY --from=client-build /app/client/dist ./public

# Create uploads directory
RUN mkdir -p uploads && chown -R nextjs:nodejs uploads
RUN mkdir -p logs && chown -R nextjs:nodejs logs

# Set permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

EXPOSE 5000

CMD ["node", "server.js"]