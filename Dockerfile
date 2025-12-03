
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

RUN npx prisma generate

ENV NODE_ENV=production

CMD ["npm", "run", "start"]
