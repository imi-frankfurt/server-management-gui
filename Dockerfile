FROM node:24-alpine AS build
WORKDIR /app

RUN npm install -g npm@latest

COPY package*.json ./

RUN npm ci

COPY . .
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache ca-certificates

ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000

COPY --from=build /app/.output ./.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
