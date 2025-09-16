# -------------------------
# Build image
# -------------------------
FROM node:22 AS builder

WORKDIR /app
COPY package*.json ./
COPY . .

RUN npm run install:all
RUN npm run build:webui
RUN npm run build:server

# -------------------------
# Final image
# -------------------------
FROM node:22

WORKDIR /app

COPY --from=builder /app/server/ /app/server/
COPY --from=builder /app/package.json /app/package.json

RUN npm install -g tsx bunyan

EXPOSE 8337

CMD ["/bin/sh", "-c", "npm run start:server:prod"]
