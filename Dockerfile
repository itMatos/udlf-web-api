FROM node:20-alpine

RUN apk add --no-cache bash

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .

COPY ./udlf /app/udlf

RUN chmod +x /app/udlf/bin/udlf

RUN mkdir -p /app/outputs

RUN mkdir -p /app/uploads

EXPOSE 8080

CMD ["npm", "run", "dev"]