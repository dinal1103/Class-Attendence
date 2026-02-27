FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# We need to run the API server
CMD ["node", "src/server.js"]
