# ==========================================
# Stage 1: Build - Compilación de la aplicación
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar OpenSSL (requerido por Prisma)
RUN apk add --no-cache openssl

# Copiar archivos de dependencias
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Instalar todas las dependencias (incluyendo devDependencies)
RUN npm ci

# Copiar código fuente y schema de Prisma
COPY src ./src
COPY prisma ./prisma

# Generar Prisma Client
RUN npx prisma generate

# Compilar el proyecto NestJS
RUN npm run build

# ==========================================
# Stage 2: Production - Imagen optimizada
# ==========================================
FROM node:20-alpine

WORKDIR /app

# Instalar OpenSSL (requerido por Prisma en producción)
RUN apk add --no-cache openssl

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --omit=dev && npm cache clean --force

# Copiar Prisma schema y migrations
COPY prisma ./prisma

# Copiar archivos compilados desde el stage de build
COPY --from=builder /app/dist ./dist

# Copiar Prisma Client generado
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Crear usuario no-root por seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

USER nestjs

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Exponer el puerto de la aplicación
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicio: ejecuta migraciones y luego inicia la app
CMD npx prisma migrate deploy && node dist/main
