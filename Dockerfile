FROM node:21.7.3-alpine3.20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV NODE_ENV="production"

EXPOSE 8050

CMD ["npm", "start"]
