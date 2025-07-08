FROM mcr.microsoft.com/playwright:v1.41.2

WORKDIR /app
COPY . .

RUN npm install

CMD ["npm", "start"]