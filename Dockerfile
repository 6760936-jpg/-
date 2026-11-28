FROM node:22-bookworm-slim
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /app
COPY . .
RUN npm install
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]