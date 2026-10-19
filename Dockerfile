FROM node:20-alpine

# Instalar dependencias del sistema y zona horaria
RUN apk add --no-cache tzdata curl

# Establecer directorio de trabajo
WORKDIR /app

# Copiar manifiestos de dependencias
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm install --omit=dev

# Copiar código del proyecto
COPY . .

# Crear directorio de logs
RUN mkdir -p logs

# Exponer puerto del bot
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000
ENV TZ=America/La_Paz

# Healthcheck nativo de Docker para orquestadores (Railway / Koyeb / Docker Swarm / Portainer)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Iniciar servidor oficial
CMD ["npm", "start"]
