FROM mcr.microsoft.com/playwright:v1.41.2-jammy

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos necesarios
COPY package.json ./
COPY server.js ./

# Instalar dependencias
RUN npm install

# Exponer el puerto que Render espera por defecto
EXPOSE 10000

# Comando de inicio
CMD ["node", "server.js"]
