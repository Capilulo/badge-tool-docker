FROM mcr.microsoft.com/playwright:v1.53.2-jammy

WORKDIR /app
COPY package.json ./
COPY server.js ./

RUN npm install

EXPOSE 10000

CMD ["node", "server.js"]
