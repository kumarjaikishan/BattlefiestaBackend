FROM node:alpine

RUN mkdir -p /app

WORKDIR /app

COPY . /app

CMD ["node", "/app/index.js"]
