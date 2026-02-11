# backend/Dockerfile

# --- ETAPA 1: BUILD ---
FROM node:20-alpine AS builder

# Nos movemos al directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos solo los package.json primero (para aprovechar la caché de Docker)
COPY package*.json ./

# Instalamos dependencias
RUN npm ci

# Copiamos TODO el código fuente (incluyendo el snapshot .json.gz si existe)
COPY . .

# Compilamos la app (NestJS genera la carpeta /dist)
RUN npm run build

# --- ETAPA 2: PRODUCCIÓN ---
FROM node:20-alpine

WORKDIR /app

# Copiamos las dependencias de producción y el código compilado de la etapa anterior
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# ¡IMPORTANTE! Copiamos el snapshot comprimido si existe en la raíz de backend
# Si falla aquí, asegúrate de haber hecho 'git push' del archivo .gz
COPY --from=builder /app/index-snapshot.json.gz ./index-snapshot.json.gz

# Limitar memoria (ajusta según el plan de Railway, free suele ser 512MB)
ENV NODE_OPTIONS="--max-old-space-size=450"

EXPOSE 3000

# Comando de arranque
CMD ["node", "dist/main"]